import { afterEach, expect, test, vi } from 'vitest';
import { GeminiResilience } from '../../server/gemini-resilience';
afterEach(() => vi.useRealTimers());
const options = { timeoutMs: 100, cooldownMs: 1000, maxConcurrent: 1, retries: 1 };
test('quota opens shared circuit without retry and allows one recovery probe', async () => {
  vi.useFakeTimers();
  const circuit = new GeminiResilience(options);
  const call = vi.fn().mockRejectedValue({ status: 429 });
  await expect(circuit.run(call)).rejects.toEqual({ status: 429 });
  await expect(circuit.run(call)).rejects.toThrow('unavailable');
  expect(call).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1000);
  expect(await circuit.run(async () => 'recovered')).toBe('recovered');
  expect(circuit.status.active).toBe(false);
});
test('transient failure retries and succeeds', async () => {
  vi.useFakeTimers();
  const call = vi.fn().mockRejectedValueOnce({ status: 503 }).mockResolvedValue('ok');
  const result = new GeminiResilience(options).run(call);
  await vi.advanceTimersByTimeAsync(500);
  expect(await result).toBe('ok');
  expect(call).toHaveBeenCalledTimes(2);
});
test('timeout aborts request, bounds latency and opens circuit', async () => {
  vi.useFakeTimers();
  let signal: AbortSignal | undefined;
  const circuit = new GeminiResilience({ ...options, retries: 0 });
  const result = circuit.run(s => { signal = s; return new Promise(() => {}); });
  const assertion = expect(result).rejects.toThrow('timeout');
  await vi.advanceTimersByTimeAsync(100);
  await assertion;
  expect(signal?.aborted).toBe(true);
  expect(circuit.status.active).toBe(true);
});
test('rejects excess concurrency and does not retry invalid credentials', async () => {
  const circuit = new GeminiResilience(options);
  let finish!: (value: string) => void;
  const pending = circuit.run(() => new Promise<string>(resolve => { finish = resolve; }));
  await expect(circuit.run(async () => 'extra')).rejects.toThrow('unavailable');
  finish('ok'); await pending;
  const invalid = vi.fn().mockRejectedValue({ status: 401 });
  await expect(circuit.run(invalid)).rejects.toEqual({ status: 401 });
  expect(invalid).toHaveBeenCalledTimes(1);
});
test('per-process budget prevents unbounded provider spending', async () => {
  vi.useFakeTimers();
  const circuit = new GeminiResilience(options);
  for (let i = 0; i < 30; i++) await circuit.run(async () => 'ok');
  await expect(circuit.run(async () => 'extra')).rejects.toThrow('budget');
  await vi.advanceTimersByTimeAsync(60000);
  expect(await circuit.run(async () => 'ok')).toBe('ok');
});
