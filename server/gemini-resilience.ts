/** One shared circuit for chat and search; bounded concurrency and one recovery probe. */
export class GeminiResilience {
  private openUntil = 0;
  private inFlight = 0;
  private recovering = false;
  private windowStart = Date.now();
  private callsInWindow = 0;
  constructor(private options = { timeoutMs: 12000, cooldownMs: 60000, maxConcurrent: 4, retries: 1 }) {}

  get status() {
    return { active: Date.now() < this.openUntil, cooldownRemainingSeconds: Math.max(0, Math.ceil((this.openUntil - Date.now()) / 1000)), inFlight: this.inFlight };
  }

  async run<T>(operation: (signal: AbortSignal) => Promise<T>): Promise<T> {
    if (Date.now() - this.windowStart >= 60000) { this.windowStart = Date.now(); this.callsInWindow = 0; }
    if (this.callsInWindow >= 30) throw new Error('Gemini request budget exhausted');
    if (Date.now() < this.openUntil || this.recovering || this.inFlight >= this.options.maxConcurrent) {
      throw new Error('Gemini temporarily unavailable');
    }
    this.recovering = this.openUntil > 0;
    this.inFlight++;
    this.callsInWindow++;
    try {
      for (let attempt = 0; ; attempt++) {
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          const timeout = new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
              controller.abort();
              reject(Object.assign(new Error('Gemini timeout'), { status: 408 }));
            }, this.options.timeoutMs);
          });
          const result = await Promise.race([operation(controller.signal), timeout]);
          if (!this.status.active) this.openUntil = 0;
          return result;
        } catch (error) {
          const status = Number((error as { status?: number })?.status);
          const transient = status === 408 || status === 429 || status >= 500 || error instanceof TypeError;
          if (!transient) {
            // Invalid key/model should not be hammered on every user request either.
            this.openUntil = Date.now() + this.options.cooldownMs;
            throw error;
          }
          if (status === 429 || attempt >= this.options.retries) {
            this.openUntil = Date.now() + this.options.cooldownMs;
            throw error;
          }
          if (timer) clearTimeout(timer);
          await new Promise(resolve => setTimeout(resolve, 300 * 2 ** attempt + Math.random() * 200));
          if (this.status.active) throw error;
        } finally {
          if (timer) clearTimeout(timer);
        }
      }
    } finally {
      this.inFlight--;
      this.recovering = false;
    }
  }
}
