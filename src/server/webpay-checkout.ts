import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { closeSync, fsyncSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { Environment, Options, WebpayPlus } from 'transbank-sdk';
import { calculateTotals, checkoutSchema, type CartItem, type Customer, type CheckoutSession, type PublicOrder } from '../checkout/model';
import { CheckoutError } from './checkout-service';
import type { PaymentConfig } from './payment-config';

export interface WebpayTransaction {
  create(buyOrder: string, sessionId: string, amount: number, returnUrl: string): Promise<{ token: string; url: string }>;
  commit(token: string): Promise<unknown>;
  status(token: string): Promise<unknown>;
}
type Record = { order: PublicOrder; customer: Customer; items: CartItem[]; capability: string; key: string; fingerprint: string; buyOrder: string; sessionId: string; commerceCode: string; gatewayToken?: string; gatewayUrl?: string };

/** Single-process service + persistent Render disk. Never deploy as ephemeral/serverless storage.
 * Create is not retried automatically. Uncertain commit is reconciled using provider status.
 * No card numbers are handled or stored. No financial state is accepted from browser JSON.
 */
export class WebpayCheckoutService {
  private orders = new Map<string, Record>();
  private keys = new Map<string, string>();
  private locks = new Map<string, Promise<unknown>>();
  constructor(private config: PaymentConfig, private transaction: WebpayTransaction = new WebpayPlus.Transaction(new Options(config.commerceCode, config.apiKey, config.environment === 'production' ? Environment.Production : Environment.Integration, config.timeoutMs))) {
    mkdirSync(config.storeDir, { recursive: true, mode: 0o700 });
    for (const file of readdirSync(config.storeDir).filter(name => /^[a-f0-9-]{36}\.json$/.test(name))) {
      const record = JSON.parse(readFileSync(path.join(config.storeDir, file), 'utf8')) as Record;
      if (!record.order?.id || record.order.mode !== config.environment || record.commerceCode !== config.commerceCode || !record.key || !record.capability) throw new Error('Almacén de pagos incompatible o dañado');
      this.orders.set(record.order.id, record); this.keys.set(record.key, record.order.id);
    }
  }
  private save(record: Record) {
    const destination = path.join(this.config.storeDir, `${record.order.id}.json`);
    const temporary = destination + '.tmp';
    const fd = openSync(temporary, 'w', 0o600);
    try { writeFileSync(fd, JSON.stringify(record)); fsyncSync(fd); } finally { closeSync(fd); }
    renameSync(temporary, destination);
    const directory = openSync(this.config.storeDir, 'r');
    try { fsyncSync(directory); } finally { closeSync(directory); }
    this.orders.set(record.order.id, record); this.keys.set(record.key, record.order.id);
  }
  private async locked<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(key);
    const pending = (async () => { if (previous) await previous.catch(() => {}); return operation(); })();
    this.locks.set(key, pending);
    try { return await pending; } finally { if (this.locks.get(key) === pending) this.locks.delete(key); }
  }
  private session(record: Record): CheckoutSession {
    if (!record.gatewayToken || !record.gatewayUrl) throw new CheckoutError(503, 'La creación del pago no pudo confirmarse. No se ha redirigido al banco; contacta soporte antes de reintentar.');
    return { order: structuredClone(record.order), paymentToken: record.capability, redirect: { url: record.gatewayUrl, token: record.gatewayToken } };
  }
  async process(body: unknown, key: string | null) {
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success || !key || !/^[A-Za-z0-9-]{16,100}$/.test(key)) throw new CheckoutError(400, 'Datos de checkout o Idempotency-Key inválidos');
    const input = parsed.data;
    const fingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex');
    return this.locked(`create:${key}`, async () => {
      const existing = this.keys.get(key);
      if (existing) {
        const record = this.orders.get(existing)!;
        if (record.fingerprint !== fingerprint) throw new CheckoutError(409, 'La clave ya está asociada a otra compra');
        return this.session(record);
      }
      if (this.orders.size >= 10000) throw new CheckoutError(503, 'Capacidad de órdenes alcanzada; contacta al administrador');
      const id = randomUUID();
      const record: Record = {
        order: { id, status: 'pending', mode: this.config.environment, provider: 'webpay_plus', totals: calculateTotals(input.items), createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 1800000).toISOString(), dte39: null },
        customer: input.customer, items: input.items, capability: randomBytes(32).toString('hex'), key, fingerprint,
        buyOrder: id.replaceAll('-', '').slice(0, 26), sessionId: randomUUID(), commerceCode: this.config.commerceCode,
      };
      this.save(record); // Durable idempotency before contacting the bank.
      let response;
      try { response = await this.transaction.create(record.buyOrder, record.sessionId, record.order.totals.totalCLP, `${this.config.appOrigin}/api/webhooks/payment`); }
      catch { throw new CheckoutError(502, 'Webpay no pudo iniciar la transacción. No se activará un pago simulado.'); }
      const url = new URL(response.url);
      const expectedHost = this.config.environment === 'production' ? 'webpay3g.transbank.cl' : 'webpay3gint.transbank.cl';
      if (url.protocol !== 'https:' || url.hostname !== expectedHost || url.port || url.username || url.password || !/^[A-Za-z0-9]{1,128}$/.test(response.token)) throw new CheckoutError(502, 'Respuesta de Webpay inválida');
      const ready = { ...record, gatewayToken: response.token, gatewayUrl: url.href };
      this.save(ready);
      return this.session(ready);
    });
  }
  private authorized(id: string, capability: string) {
    const record = this.orders.get(id);
    if (!record || !/^[a-f0-9]{64}$/.test(capability) || !timingSafeEqual(Buffer.from(capability), Buffer.from(record.capability))) throw new CheckoutError(404, 'Orden no encontrada');
    return record;
  }
  private apply(record: Record, response: unknown) {
    record = structuredClone(record);
    const result = response as { buy_order?: unknown; session_id?: unknown; amount?: unknown; status?: unknown; response_code?: unknown } | null;
    if (!result || result.buy_order !== record.buyOrder || result.session_id !== record.sessionId || result.amount !== record.order.totals.totalCLP) throw new CheckoutError(502, 'La respuesta de Webpay no coincide con la orden');
    if (result.status === 'AUTHORIZED' && result.response_code === 0) {
      record.order.status = 'paid';
      const totals = record.order.totals;
      record.order.dte39 = { type: 39, status: 'ready_for_issuance', MntNeto: totals.netCLP, IVA: totals.ivaCLP, MntTotal: totals.totalCLP };
    } else if (['FAILED', 'REVERSED', 'NULLIFIED'].includes(String(result.status))) {
      record.order.status = 'failed'; record.order.dte39 = null;
    } // INITIALIZED/unknown/ambiguous remain pending; never fabricate a paid state.
    this.save(record);
    return structuredClone(record.order);
  }
  async status(id: string, capability: string) {
    return this.locked(`order:${id}`, async () => {
      const record = this.authorized(id, capability);
      if (record.order.status !== 'pending' || !record.gatewayToken) return structuredClone(record.order);
      try { return this.apply(record, await this.transaction.status(record.gatewayToken)); }
      catch { throw new CheckoutError(503, 'No se pudo verificar el estado con Webpay. Conserva esta orden y vuelve a consultar.'); }
    });
  }
  async callback(body: unknown) {
    if (!body || typeof body !== 'object') throw new CheckoutError(400, 'Retorno de Webpay inválido');
    const params = body as { token_ws?: unknown; TBK_TOKEN?: unknown };
    const token = params.token_ws ?? params.TBK_TOKEN;
    if (typeof token !== 'string' || !/^[A-Za-z0-9]{1,128}$/.test(token)) throw new CheckoutError(400, 'Token de Webpay requerido');
    const found = [...this.orders.values()].find(record => record.gatewayToken === token);
    if (!found) throw new CheckoutError(404, 'Transacción desconocida');
    return this.locked(`order:${found.order.id}`, async () => {
      const record = this.orders.get(found.order.id)!;
      if (record.order.status !== 'pending') return structuredClone(record.order);
      let response;
      try {
        // A cancellation token is never committed. Status, not browser flags, is authoritative.
        if (params.token_ws) {
          try { response = await this.transaction.commit(token); }
          catch { response = await this.transaction.status(token); }
        } else response = await this.transaction.status(token);
      } catch { throw new CheckoutError(503, 'Confirmación pendiente de Webpay; vuelve a consultar la orden'); }
      return this.apply(record, response);
    });
  }
}
