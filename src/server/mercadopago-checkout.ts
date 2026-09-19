import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { createClient } from 'redis';
import { calculateTotals, checkoutSchema, type CheckoutSession, type PublicOrder, type Customer, type CartItem } from '../checkout/model';
import { CheckoutError } from './checkout-service';
import type { PaymentConfig } from './payment-config';

export type PaymentRow = {
  id: string; environment: string; idempotency_key: string; fingerprint: string;
  capability: string; status: PublicOrder['status']; order_data: PublicOrder;
  checkout_data: { customer: Customer; items: CartItem[] };
  redirect_url: string | null; payment_id?: string; paid_at?: string;
};
export interface PaymentStore {
  find(field: 'id' | 'idempotency_key', value: string): Promise<PaymentRow | undefined>;
  insert(row: PaymentRow): Promise<boolean>;
  patch(id: string, values: Partial<PaymentRow>, pendingOnly?: boolean): Promise<void>;
}
export interface PaymentLock {
  acquire(key: string, owner: string): Promise<boolean>;
  release(key: string, owner: string): Promise<void>;
}
export class SupabasePaymentStore implements PaymentStore {
  constructor(private config: PaymentConfig, private request = fetch) {}
  private async call(query: string, method = 'GET', body?: unknown) {
    const response = await this.request(`${this.config.supabaseUrl}/rest/v1/payment_orders?${query}`, {
      method, signal: AbortSignal.timeout(10000),
      headers: { apikey: this.config.supabaseKey, Authorization: `Bearer ${this.config.supabaseKey}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (response.status === 409 && method === 'POST') return null;
    if (!response.ok) throw new CheckoutError(503, 'Persistencia de pagos no disponible');
    return response.json() as Promise<PaymentRow[]>;
  }
  async find(field: 'id' | 'idempotency_key', value: string) {
    const rows = await this.call(`${field}=eq.${encodeURIComponent(value)}&environment=eq.${this.config.environment}&limit=1`);
    return rows?.[0];
  }
  async insert(row: PaymentRow) { return (await this.call('', 'POST', row)) !== null; }
  async patch(id: string, values: Partial<PaymentRow>, pendingOnly = false) {
    await this.call(`id=eq.${encodeURIComponent(id)}&environment=eq.${this.config.environment}${pendingOnly ? '&status=eq.pending' : ''}`, 'PATCH', values);
  }
}
export class RedisPaymentLock implements PaymentLock {
  private client;
  private connecting?: Promise<unknown>;
  constructor(url: string) {
    this.client = createClient({ url, disableOfflineQueue: true, socket: { connectTimeout: 3000, reconnectStrategy: false } });
    this.client.on('error', () => { /* No secrets or payment payloads in logs. Requests fail closed. */ });
  }
  private async ready() {
    if (!this.client.isReady) {
      this.connecting ??= this.client.connect().finally(() => { this.connecting = undefined; });
      await this.connecting;
    }
    return this.client;
  }
  async acquire(key: string, owner: string) {
    return (await (await this.ready()).set(key, owner, { NX: true, EX: 60 })) === 'OK';
  }
  async release(key: string, owner: string) {
    await (await this.ready()).eval("if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end", { keys: [key], arguments: [owner] });
  }
}

/** Official manifest signs the URL data.id, request ID and timestamp, NOT the JSON body. */
export function verifyMercadoPagoSignature(id: unknown, requestId: string | undefined, signature: string | undefined, secret: string) {
  if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{1,128}$/.test(id) || !requestId || !/^[\w-]{1,200}$/.test(requestId) || !signature || !secret) throw new CheckoutError(401, 'Firma inválida');
  const parts = signature.split(',').map(part => part.trim().split('='));
  const timestamps = parts.filter(([key]) => key === 'ts');
  const signatures = parts.filter(([key]) => key === 'v1');
  const ts = timestamps[0]?.[1];
  if (timestamps.length !== 1 || !ts || !/^\d{10,13}$/.test(ts) || !signatures.length) throw new CheckoutError(401, 'Firma inválida');
  const expected = createHmac('sha256', secret).update(`id:${id.toLowerCase()};request-id:${requestId};ts:${ts};`).digest();
  if (!signatures.some(([, value]) => /^[a-fA-F0-9]{64}$/.test(value || '') && timingSafeEqual(Buffer.from(value, 'hex'), expected))) throw new CheckoutError(401, 'Firma inválida');
  // Delayed/retried authentic notifications are safe: provider lookup + atomic pending-only transition.
  return id.toLowerCase();
}

export class MercadoPagoCheckoutService {
  constructor(private config: PaymentConfig, private store: PaymentStore = new SupabasePaymentStore(config), private lock: PaymentLock = new RedisPaymentLock(config.redisUrl), private request = fetch) {}
  private async gateway(path: string, body?: unknown) {
    const response = await this.request(`https://api.mercadopago.com${path}`, {
      method: body ? 'POST' : 'GET', signal: AbortSignal.timeout(Math.min(this.config.timeoutMs, 10000)),
      headers: { Authorization: `Bearer ${this.config.mpAccessToken}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) throw new CheckoutError(502, 'Mercado Pago no pudo verificar la operación');
    return response.json();
  }
  private session(row: PaymentRow): CheckoutSession {
    if (!row.redirect_url) throw new CheckoutError(503, 'Creación pendiente de conciliación. Conserva la orden; no inicies otra compra.');
    return { order: { ...row.order_data, status: row.status }, paymentToken: row.capability, redirect: { url: row.redirect_url, token: '', method: 'GET' } };
  }
  async process(body: unknown, key: string | null) {
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success || !key || !/^[A-Za-z0-9-]{16,100}$/.test(key)) throw new CheckoutError(400, 'Datos de checkout o Idempotency-Key inválidos');
    const fingerprint = createHash('sha256').update(JSON.stringify(parsed.data)).digest('hex');
    const existing = await this.store.find('idempotency_key', key);
    if (existing) {
      if (existing.fingerprint !== fingerprint) throw new CheckoutError(409, 'La clave ya está asociada a otra compra');
      return this.session(existing);
    }
    const id = randomUUID();
    const order: PublicOrder = { id, status: 'pending', mode: this.config.environment, provider: 'mercadopago', totals: calculateTotals(parsed.data.items), createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 1800000).toISOString(), dte39: null };
    const row: PaymentRow = { id, environment: this.config.environment, idempotency_key: key, fingerprint, capability: randomBytes(32).toString('hex'), status: 'pending', order_data: order, checkout_data: parsed.data, redirect_url: null };
    // Unique DB constraint owns creation across all instances, even if the process crashes.
    if (!await this.store.insert(row)) throw new CheckoutError(409, 'La orden ya se está creando; reintenta con la misma clave');
    const preference = await this.gateway('/checkout/preferences', {
      external_reference: id,
      items: [{ id, title: 'Compra tienda online (incluye despacho)', quantity: 1, currency_id: 'CLP', unit_price: order.totals.totalCLP }],
      back_urls: { success: `${this.config.appOrigin}/checkout`, failure: `${this.config.appOrigin}/checkout`, pending: `${this.config.appOrigin}/checkout` },
      notification_url: `${this.config.appOrigin}/api/webhooks/mercadopago`,
      expires: true, expiration_date_to: order.expiresAt,
    });
    const redirect = this.config.environment === 'production' ? preference.init_point : preference.sandbox_init_point;
    const url = new URL(redirect);
    if (url.protocol !== 'https:' || !['www.mercadopago.cl', 'sandbox.mercadopago.cl'].includes(url.hostname) || url.port || url.username || url.password) throw new CheckoutError(502, 'Destino de pago inválido');
    await this.store.patch(id, { redirect_url: url.href });
    return this.session({ ...row, redirect_url: url.href });
  }
  async status(id: string, capability: string) {
    if (!/^[a-f0-9-]{36}$/.test(id) || !/^[a-f0-9]{64}$/.test(capability)) throw new CheckoutError(404, 'Orden no encontrada');
    const row = await this.store.find('id', id);
    if (!row || !timingSafeEqual(Buffer.from(row.capability), Buffer.from(capability))) throw new CheckoutError(404, 'Orden no encontrada');
    return { ...row.order_data, status: row.status };
  }
  async webhook(id: unknown, requestId: string | undefined, signature: string | undefined) {
    const paymentId = verifyMercadoPagoSignature(id, requestId, signature, this.config.mpWebhookSecret);
    const key = `lock:webhook:mp:${paymentId}`;
    const owner = randomUUID();
    if (!await this.lock.acquire(key, owner)) throw new CheckoutError(503, 'Pago en procesamiento; reintentar notificación');
    try {
      const payment = await this.gateway(`/v1/payments/${encodeURIComponent(paymentId)}`);
      if (String(payment.id).toLowerCase() !== paymentId || payment.live_mode !== (this.config.environment === 'production') || typeof payment.external_reference !== 'string' || !/^[a-f0-9-]{36}$/.test(payment.external_reference)) throw new CheckoutError(409, 'Pago no coincide con el entorno u orden');
      const row = await this.store.find('id', payment.external_reference);
      if (!row) throw new CheckoutError(503, 'Orden no disponible para conciliación');
      if (payment.currency_id !== 'CLP' || payment.transaction_amount !== row.order_data.totals.totalCLP) throw new CheckoutError(409, 'Monto o moneda no coincide con la orden');
      if (row.status !== 'pending') return;
      // Failed attempts can be retried within one preference. Only approved payments close the order.
      if (payment.status !== 'approved') return;
      const totals = row.order_data.totals;
      await this.store.patch(row.id, {
        status: 'paid', payment_id: paymentId, paid_at: new Date().toISOString(),
        order_data: { ...row.order_data, status: 'paid', dte39: { type: 39, status: 'ready_for_issuance', MntNeto: totals.netCLP, IVA: totals.ivaCLP, MntTotal: totals.totalCLP } },
      }, true);
    } finally { await this.lock.release(key, owner); }
  }
}
