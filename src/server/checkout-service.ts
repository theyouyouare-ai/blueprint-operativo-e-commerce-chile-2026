import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { calculateTotals, checkoutSchema, type Customer, type CartItem, type PublicOrder } from '../checkout/model';

export class CheckoutError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const webhookSchema = z.object({
  orderId: z.string().uuid(), transactionToken: z.string().regex(/^[a-f0-9]{64}$/),
  status: z.enum(['AUTHORIZED', 'FAILED']), response_code: z.number().int(),
  amount: z.number().int().positive(), currency: z.literal('CLP'),
}).strict();
type StoredOrder = { public: PublicOrder; customer: Customer; items: CartItem[]; token: string; fingerprint: string; key: string };

/** Functional mock only: no card data, no real authorization or DTE issuance.
 * In-memory orders expire after 30 min; new checkouts purge records older than 24 hours.
 * Real Webpay requires transaction commit verification, not this mock webhook.
 * https://transbankdevelopers.com/documentacion/webpay-plus
 */
export class CheckoutService {
  private orders = new Map<string, StoredOrder>();
  private idempotency = new Map<string, string>();
  constructor(private secret = process.env.PAYMENT_WEBHOOK_SECRET || randomBytes(32).toString('hex'), private now = () => Date.now()) {}
  private cleanup() {
    for (const [id, order] of this.orders) {
      if (this.now() - Date.parse(order.public.createdAt) >= 86400000) { this.orders.delete(id); this.idempotency.delete(order.key); }
    }
  }
  private refresh(order: StoredOrder) {
    if (order.public.status === 'pending' && this.now() >= Date.parse(order.public.expiresAt)) order.public.status = 'expired';
    return order;
  }
  process(body: unknown, key: string | null) {
    const input = checkoutSchema.safeParse(body);
    if (!input.success) throw new CheckoutError(400, input.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; '));
    if (!key || !/^[A-Za-z0-9-]{16,100}$/.test(key)) throw new CheckoutError(400, 'Idempotency-Key requerido (16–100 caracteres)');
    this.cleanup();
    const fingerprint = createHash('sha256').update(JSON.stringify(input.data)).digest('hex');
    const existingId = this.idempotency.get(key);
    if (existingId) {
      const existing = this.refresh(this.orders.get(existingId)!);
      if (existing.fingerprint !== fingerprint) throw new CheckoutError(409, 'La clave ya está asociada a otra compra');
      return { order: structuredClone(existing.public), paymentToken: existing.token };
    }
    if (this.orders.size >= 1000) throw new CheckoutError(503, 'Simulador ocupado. Inténtalo más tarde');
    const order: StoredOrder = {
      public: { id: randomUUID(), status: 'pending', mode: 'mock', provider: 'webpay_plus_mock', totals: calculateTotals(input.data.items), createdAt: new Date(this.now()).toISOString(), expiresAt: new Date(this.now() + 1800000).toISOString(), dte39: null },
      customer: input.data.customer, items: input.data.items, key, fingerprint, token: randomBytes(32).toString('hex'),
    };
    this.orders.set(order.public.id, order);
    this.idempotency.set(key, order.public.id);
    return { order: structuredClone(order.public), paymentToken: order.token };
  }
  private authorizedOrder(id: string, token: string) {
    const order = this.orders.get(id);
    if (!order || !/^[a-f0-9]{64}$/.test(token) || !timingSafeEqual(Buffer.from(token), Buffer.from(order.token))) throw new CheckoutError(404, 'Orden no encontrada');
    return this.refresh(order);
  }
  status(id: string, token: string) { return structuredClone(this.authorizedOrder(id, token).public); }
  private sign(raw: string, timestamp: string) { return createHmac('sha256', this.secret).update(`${timestamp}.${raw}`).digest('hex'); }
  webhook(raw: string, signature: string | null, timestamp: string | null) {
    if (!timestamp || !/^\d+$/.test(timestamp) || Math.abs(this.now() - Number(timestamp)) > 300000 || !signature || !/^[a-f0-9]{64}$/.test(signature)) throw new CheckoutError(401, 'Firma inválida o vencida');
    if (!timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(this.sign(raw, timestamp), 'hex'))) throw new CheckoutError(401, 'Firma inválida');
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { throw new CheckoutError(400, 'JSON inválido'); }
    const event = webhookSchema.safeParse(parsed);
    if (!event.success) throw new CheckoutError(400, 'Confirmación inválida');
    const data = event.data;
    const stored = this.authorizedOrder(data.orderId, data.transactionToken);
    if (stored.public.totals.totalCLP !== data.amount) throw new CheckoutError(409, 'Monto no coincide con la orden');
    if (data.status === 'AUTHORIZED' && data.response_code !== 0) throw new CheckoutError(400, 'Autorización inconsistente');
    const next = data.status === 'AUTHORIZED' && data.response_code === 0 ? 'paid' : 'failed';
    if (stored.public.status === next) return structuredClone(stored.public); // Idempotent notification.
    if (stored.public.status !== 'pending') throw new CheckoutError(409, 'La orden ya está cerrada');
    stored.public.status = next;
    if (next === 'paid') {
      const totals = stored.public.totals;
      stored.public.dte39 = { type: 39, status: 'ready_for_issuance', MntNeto: totals.netCLP, IVA: totals.ivaCLP, MntTotal: totals.totalCLP };
    }
    return structuredClone(stored.public);
  }
  mockConfirmation(body: unknown) {
    const input = z.object({ orderId: z.string().uuid(), paymentToken: z.string().regex(/^[a-f0-9]{64}$/), outcome: z.enum(['approve', 'reject']) }).strict().safeParse(body);
    if (!input.success) throw new CheckoutError(400, 'Solicitud de simulación inválida');
    const { orderId, paymentToken, outcome } = input.data;
    const order = this.authorizedOrder(orderId, paymentToken);
    const raw = JSON.stringify({ orderId, transactionToken: paymentToken, status: outcome === 'approve' ? 'AUTHORIZED' : 'FAILED', response_code: outcome === 'approve' ? 0 : -1, amount: order.public.totals.totalCLP, currency: 'CLP' });
    const timestamp = String(this.now());
    // Simulated provider invokes the exact same signature verifier/state transition as HTTP webhook.
    return this.webhook(raw, this.sign(raw, timestamp), timestamp);
  }
}
// Shared by the Express adapter in a single Node process.
const scope = globalThis as typeof globalThis & { __blueprintCheckout?: CheckoutService };
export function getCheckoutService() { return scope.__blueprintCheckout ??= new CheckoutService(); }
