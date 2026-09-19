import { createHmac } from 'node:crypto';
import { describe, expect, test, vi } from 'vitest';
import { paymentConfig } from '../server/payment-config';
import { MercadoPagoCheckoutService, SupabasePaymentStore, verifyMercadoPagoSignature, type PaymentRow } from '../server/mercadopago-checkout';

const env = { MERCADOPAGO_ACCESS_TOKEN: 'test-token', MERCADOPAGO_WEBHOOK_SECRET: 'test-secret', SUPABASE_URL: 'https://db.example.com', SUPABASE_SERVICE_ROLE_KEY: 'service-key', REDIS_URL: 'redis://localhost:6379', APP_URL: 'https://shop.example.com' };
const input = { items: [{ productId: 'cepillo-vapor', quantity: 1 }], customer: { name: 'Prueba Pago', documentType: 'RUT', document: '12345678-5', email: 'test@example.com', phone: '+56912345678', address: 'Calle Prueba 123', commune: 'Santiago', region: 'Metropolitana' } };
const requestId = 'request-123';
function signature(id = '123', ts = '1704908010') { return `ts=${ts},v1=${createHmac('sha256', env.MERCADOPAGO_WEBHOOK_SECRET).update(`id:${id};request-id:${requestId};ts:${ts};`).digest('hex')}`; }
function setup() {
  const rows = new Map<string, PaymentRow>();
  const store = {
    find: vi.fn(async (field: 'id' | 'idempotency_key', value: string) => [...rows.values()].find(row => row[field] === value)),
    insert: vi.fn(async (row: PaymentRow) => {
      if ([...rows.values()].some(old => old.idempotency_key === row.idempotency_key)) return false;
      rows.set(row.id, structuredClone(row)); return true;
    }),
    patch: vi.fn(async (id: string, values: Partial<PaymentRow>, pendingOnly = false) => {
      const row = rows.get(id)!;
      if (!pendingOnly || row.status === 'pending') rows.set(id, { ...row, ...values });
    }),
  };
  const held = new Set<string>();
  const lock = { acquire: vi.fn(async (key: string, _owner: string) => { if (held.has(key)) return false; held.add(key); return true; }), release: vi.fn(async (key: string, _owner: string) => { held.delete(key); }) };
  let payment: Record<string, unknown> = {};
  const request = vi.fn(async (url: string | URL | Request, _options?: RequestInit) => new Response(JSON.stringify(String(url).endsWith('/checkout/preferences') ? { sandbox_init_point: 'https://sandbox.mercadopago.cl/checkout/v1/redirect?pref_id=test', init_point: 'https://www.mercadopago.cl/checkout/v1/redirect?pref_id=test' } : payment), { status: 200 }));
  const service = new MercadoPagoCheckoutService(paymentConfig(env), store, lock, request);
  return { service, store, lock, rows, request, approve: (id: string, overrides = {}) => { payment = { id: 123, external_reference: id, live_mode: false, currency_id: 'CLP', transaction_amount: 28790, status: 'approved', ...overrides }; } };
}

describe('Mercado Pago configuration and signature', () => {
  test('token selects MP; missing dependencies fail closed; no credentials preserve mock', () => {
    expect(paymentConfig(env).provider).toBe('mercadopago');
    expect(paymentConfig({}).mode).toBe('mock');
    for (const key of ['MERCADOPAGO_WEBHOOK_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'REDIS_URL']) expect(() => paymentConfig({ ...env, [key]: '' })).toThrow();
    expect(() => paymentConfig({ ...env, PAYMENT_ENV: 'production', APP_URL: 'http://localhost:3000' })).toThrow('HTTPS');
  });
  test('official manifest accepts delayed authentic notifications and normalized IDs', () => {
    expect(verifyMercadoPagoSignature('123', requestId, signature(), 'test-secret')).toBe('123');
    expect(verifyMercadoPagoSignature('ABC', requestId, signature('abc'), 'test-secret')).toBe('abc');
  });
  test.each([undefined, 'v1=invalid', signature().replace('v1=', 'v1=0'), `${signature()},ts=1704908010`])('rejects malformed signature %s', value => {
    expect(() => verifyMercadoPagoSignature('123', requestId, value, 'test-secret')).toThrow();
  });
  test('rejects tampered id, request ID or secret', () => {
    expect(() => verifyMercadoPagoSignature('124', requestId, signature(), 'test-secret')).toThrow();
    expect(() => verifyMercadoPagoSignature('123', 'other', signature(), 'test-secret')).toThrow();
    expect(() => verifyMercadoPagoSignature('123', requestId, signature(), 'wrong')).toThrow();
  });
});

test('server-calculated preference and durable idempotency survive new service instances', async () => {
  const t = setup();
  const session = await t.service.process(input, 'idempotency-key-001');
  const restored = new MercadoPagoCheckoutService(paymentConfig(env), t.store, t.lock, t.request);
  expect(await restored.process(input, 'idempotency-key-001')).toEqual(session);
  expect(t.request).toHaveBeenCalledTimes(1);
  const body = JSON.parse(t.request.mock.calls[0][1]!.body as string);
  expect(body.items[0].unit_price).toBe(28790);
  expect(body.external_reference).toBe(session.order.id);
  expect(body.notification_url).toBe('https://shop.example.com/api/webhooks/mercadopago');
  expect(session.redirect?.method).toBe('GET');
  await expect(restored.process({ ...input, items: [{ productId: 'cepillo-vapor', quantity: 2 }] }, 'idempotency-key-001')).rejects.toMatchObject({ status: 409 });
  await expect(restored.status(session.order.id, 'a'.repeat(64))).rejects.toMatchObject({ status: 404 });
});

test('simultaneous checkout claims create at most one preference', async () => {
  const t = setup();
  await Promise.allSettled([t.service.process(input, 'idempotency-key-001'), t.service.process(input, 'idempotency-key-001')]);
  expect(t.request).toHaveBeenCalledTimes(1);
});

test('provider failure never simulates success or recreates an uncertain preference', async () => {
  const t = setup(); t.request.mockResolvedValueOnce(new Response('{}', { status: 500 }));
  await expect(t.service.process(input, 'idempotency-key-001')).rejects.toMatchObject({ status: 502 });
  await expect(t.service.process(input, 'idempotency-key-001')).rejects.toMatchObject({ status: 503 });
  expect(t.request).toHaveBeenCalledTimes(1);
});

test('approved payment is applied once and concurrent webhook requests are retriable', async () => {
  const t = setup(); const session = await t.service.process(input, 'idempotency-key-001'); t.approve(session.order.id);
  const results = await Promise.allSettled([t.service.webhook('123', requestId, signature()), t.service.webhook('123', requestId, signature())]);
  expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
  await t.service.webhook('123', requestId, signature());
  expect(t.store.patch.mock.calls.filter(call => call[2])).toHaveLength(1);
  expect(t.lock.acquire).toHaveBeenCalledWith('lock:webhook:mp:123', expect.any(String));
  const order = await t.service.status(session.order.id, session.paymentToken);
  expect(order.status).toBe('paid'); expect(order.dte39?.MntTotal).toBe(28790);
});

test.each([{ transaction_amount: 1 }, { currency_id: 'USD' }, { live_mode: true }, { id: 124 }, { external_reference: 'unknown' }])('does not update mismatched payment %j; releases lock', async overrides => {
  const t = setup(); const session = await t.service.process(input, 'idempotency-key-001'); t.approve(session.order.id, overrides);
  await expect(t.service.webhook('123', requestId, signature())).rejects.toMatchObject({ status: 409 });
  expect(t.rows.get(session.order.id)?.status).toBe('pending'); expect(t.lock.release).toHaveBeenCalledTimes(1);
});

test.each(['pending', 'in_process', 'rejected', 'cancelled', 'refunded'])('status %s does not authorize an order', async status => {
  const t = setup(); const session = await t.service.process(input, 'idempotency-key-001'); t.approve(session.order.id, { status });
  await t.service.webhook('123', requestId, signature()); expect(t.rows.get(session.order.id)?.status).toBe('pending');
});

test('Redis and database failures propagate; retries can complete', async () => {
  const t = setup(); const session = await t.service.process(input, 'idempotency-key-001'); t.approve(session.order.id);
  t.lock.acquire.mockRejectedValueOnce(new Error('Redis unavailable'));
  await expect(t.service.webhook('123', requestId, signature())).rejects.toThrow();
  t.store.patch.mockRejectedValueOnce(new Error('DB unavailable'));
  await expect(t.service.webhook('123', requestId, signature())).rejects.toThrow();
  expect(t.lock.release).toHaveBeenCalledTimes(1);
  await t.service.webhook('123', requestId, signature()); expect(t.rows.get(session.order.id)?.status).toBe('paid');
});

test('invalid signature never calls Redis or provider', async () => {
  const t = setup(); await expect(t.service.webhook('123', requestId, 'invalid')).rejects.toMatchObject({ status: 401 });
  expect(t.lock.acquire).not.toHaveBeenCalled(); expect(t.request).not.toHaveBeenCalled();
});

test('Supabase PATCH includes atomic pending and environment filters; HTTP failures are not swallowed', async () => {
  const request = vi.fn(async (_url: string | URL | Request, _options?: RequestInit) => new Response('[]', { status: 200 }));
  const store = new SupabasePaymentStore(paymentConfig(env), request);
  await store.patch('order-id', { status: 'paid' }, true);
  expect(String(request.mock.calls[0][0])).toContain('id=eq.order-id&environment=eq.sandbox&status=eq.pending');
  expect(request.mock.calls[0][1]?.method).toBe('PATCH');
  request.mockResolvedValueOnce(new Response('{}', { status: 500 }));
  await expect(store.patch('order-id', { status: 'paid' }, true)).rejects.toMatchObject({ status: 503 });
});
