import { describe, expect, test } from 'vitest';
import { createHmac } from 'node:crypto';
import { calculateTotals, splitGrossCLP, validRut } from './model';
import { CheckoutError, CheckoutService } from '../server/checkout-service';
const customer = { name: 'Cliente Prueba', documentType: 'RUT', document: '12.345.678-5', email: 'prueba@example.com', phone: '+56 9 1234 5678', address: 'Calle Demo 123', commune: 'Santiago', region: 'Metropolitana' };
const body = { items: [{ productId: 'cepillo-vapor', quantity: 1 }], customer };
const key = 'test-checkout-key-001';
const secret = 'test-webhook-secret';
const now = 1800000000000;
function fixture() {
  const service = new CheckoutService(secret, () => now);
  const session = service.process(body, key);
  const payload = { orderId: session.order.id, transactionToken: session.paymentToken, status: 'AUTHORIZED', response_code: 0, amount: session.order.totals.totalCLP, currency: 'CLP' };
  function webhook(data = payload, timestamp = String(now)) {
    const raw = JSON.stringify(data);
    const signature = createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex');
    return service.webhook(raw, signature, timestamp);
  }
  return { service, session, payload, webhook };
}
function expectStatus(fn: () => unknown, status: number) {
  try { fn(); throw new Error('Expected an error'); } catch (error) { expect(error).toBeInstanceOf(CheckoutError); expect((error as CheckoutError).status).toBe(status); }
}
describe('CLP totals and input validation', () => {
  test('gross = net + IVA; shipping is included once', () => {
    const totals = calculateTotals(body.items);
    expect(totals.productsGrossCLP).toBe(24990);
    expect(totals.shippingGrossCLP).toBe(3800);
    expect(totals.totalCLP).toBe(28790);
    expect(totals.netCLP).toBe(Math.round(28790 / 1.19));
    expect(totals.netCLP + totals.ivaCLP).toBe(28790);
    expect(totals.productsNetCLP + totals.shippingNetCLP).toBe(totals.netCLP);
  });
  test('free shipping threshold and integer-peso arithmetic', () => {
    const totals = calculateTotals([{ productId: 'lampara-levitante', quantity: 1 }]);
    expect(totals.shippingGrossCLP).toBe(0);
    expect(totals.totalCLP).toBe(49990);
    expect(totals.netCLP + totals.ivaCLP).toBe(totals.totalCLP);
  });
  test('validates RUT checksum', () => { expect(validRut('12.345.678-5')).toBe(true); expect(validRut('12.345.678-9')).toBe(false); });
  test.each([
    { ...body, totalCLP: 1 },
    { ...body, items: [] },
    { ...body, items: [{ productId: 'unknown', quantity: 1 }] },
    { ...body, items: [{ productId: 'cepillo-vapor', quantity: -1 }] },
    { ...body, items: [{ productId: 'cepillo-vapor', quantity: 1.5 }] },
    { ...body, items: [...body.items, ...body.items] },
    { ...body, customer: { ...customer, phone: '+123456' } },
    { ...body, customer: { ...customer, document: '12345678-9' } },
  ])('rejects tampering and malformed checkout payload %#', invalid => { expectStatus(() => new CheckoutService().process(invalid, key), 400); });
});
describe('payment lifecycle', () => {
  test('idempotency returns one order and rejects changed request', () => {
    const { service, session } = fixture();
    expect(service.process(body, key).order.id).toBe(session.order.id);
    expectStatus(() => service.process({ ...body, items: [{ productId: 'cepillo-vapor', quantity: 2 }] }, key), 409);
  });
  test('signed authorization creates DTE39 draft, repeated event is idempotent', () => {
    const { webhook } = fixture();
    const order = webhook();
    expect(order.status).toBe('paid');
    expect(order.dte39).toEqual({ type: 39, status: 'ready_for_issuance', MntNeto: order.totals.netCLP, IVA: order.totals.ivaCLP, MntTotal: order.totals.totalCLP });
    expect(webhook()).toEqual(order);
    expect(order).not.toHaveProperty('customer');
  });
  test('unsigned and stale notifications cannot mark orders paid', () => {
    const { service, session, payload, webhook } = fixture();
    expectStatus(() => service.webhook(JSON.stringify(payload), null, String(now)), 401);
    expectStatus(() => service.webhook(JSON.stringify(payload), 'a'.repeat(64), String(now)), 401);
    expectStatus(() => webhook(payload, String(now - 300001)), 401);
    expect(service.status(session.order.id, session.paymentToken).status).toBe('pending');
  });
  test('signed but wrong amount or response code does not authorize', () => {
    const { payload, webhook } = fixture();
    expectStatus(() => webhook({ ...payload, amount: 1 }), 409);
    expectStatus(() => webhook({ ...payload, response_code: -1 }), 400);
  });
  test('mock rejection has no DTE and cannot later become paid', () => {
    const { service, session } = fixture();
    const order = service.mockConfirmation({ orderId: session.order.id, paymentToken: session.paymentToken, outcome: 'reject' });
    expect(order.status).toBe('failed'); expect(order.dte39).toBeNull();
    expectStatus(() => service.mockConfirmation({ orderId: session.order.id, paymentToken: session.paymentToken, outcome: 'approve' }), 409);
  });
  test('expiry prevents confirmation and limits personal data retention', () => {
    let time = now;
    const service = new CheckoutService(secret, () => time);
    const session = service.process(body, key);
    time += 1800000;
    expect(service.status(session.order.id, session.paymentToken).status).toBe('expired');
    expectStatus(() => service.mockConfirmation({ orderId: session.order.id, paymentToken: session.paymentToken, outcome: 'approve' }), 409);
    time += 86400000;
    expect(service.process(body, key).order.id).not.toBe(session.order.id);
    expectStatus(() => service.status(session.order.id, session.paymentToken), 404);
  });
  test('order status requires the random capability token', () => {
    const { service, session } = fixture();
    expectStatus(() => service.status(session.order.id, 'x'.repeat(64)), 404);
    expectStatus(() => service.status(session.order.id, 'é'.repeat(64)), 404);
  });
});

test('CLP split preserves exact rounding up to maximum safe integer', () => {
  for (const gross of [0, 1, 59, 60, 119, 28790, 49990, 1000000000000, Number.MAX_SAFE_INTEGER]) {
    const { netCLP, ivaCLP } = splitGrossCLP(gross);
    expect(Number.isSafeInteger(netCLP)).toBe(true);
    expect(Number.isSafeInteger(ivaCLP)).toBe(true);
    expect(netCLP + ivaCLP).toBe(gross);
    const difference = BigInt(netCLP) * 119n - BigInt(gross) * 100n;
    expect(difference >= -59n && difference <= 59n).toBe(true);
  }
  for (const invalid of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) expect(() => splitGrossCLP(invalid)).toThrow();
});
