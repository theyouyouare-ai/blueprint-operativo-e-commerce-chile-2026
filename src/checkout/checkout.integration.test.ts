import { afterAll, beforeAll, expect, test } from 'vitest';
import express from 'express';
import { createHmac, randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { checkoutRouter } from '../server/checkout-router';
let server: Server;
let base = '';
const previousSecret = process.env.PAYMENT_WEBHOOK_SECRET;
const secret = 'http-test-secret';
beforeAll(async () => {
  process.env.PAYMENT_WEBHOOK_SECRET = secret;
  const app = express();
  app.use('/api', checkoutRouter);
  app.use(express.json());
  server = await new Promise<Server>(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  const address = server.address();
  base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;
});
afterAll(async () => {
  if (previousSecret === undefined) delete process.env.PAYMENT_WEBHOOK_SECRET; else process.env.PAYMENT_WEBHOOK_SECRET = previousSecret;
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});
async function createOrder() {
  const response = await fetch(`${base}/api/checkout/process`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': randomUUID() }, body: JSON.stringify({
    items: [{ productId: 'cepillo-vapor', quantity: 1 }],
    customer: { name: 'Cliente Demo', documentType: 'RUT', document: '12345678-5', email: 'test@example.com', phone: '+56912345678', address: 'Calle Demo 123', commune: 'Santiago', region: 'Metropolitana' },
  }) });
  expect(response.status).toBe(200);
  return response.json();
}
test('Express accepts signed raw JSON webhook and exposes paid status without personal data', async () => {
  const { order, paymentToken } = await createOrder();
  const raw = JSON.stringify({ orderId: order.id, transactionToken: paymentToken, status: 'AUTHORIZED', response_code: 0, amount: order.totals.totalCLP, currency: 'CLP' }, null, 2);
  const timestamp = String(Date.now());
  const signature = createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex');
  const headers = { 'Content-Type': 'application/json', 'x-payment-timestamp': timestamp, 'x-payment-signature': signature };
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(`${base}/api/webhooks/payment`, { method: 'POST', headers, body: raw });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.order.status).toBe('paid');
    expect(data.order.dte39.MntNeto + data.order.dte39.IVA).toBe(data.order.dte39.MntTotal);
    expect(data.order.customer).toBeUndefined();
  }
  const status = await fetch(`${base}/api/checkout/status/${order.id}`, { headers: { Authorization: `Bearer ${paymentToken}` } });
  expect((await status.json()).order.status).toBe('paid');
  expect(status.headers.get('cache-control')).toBe('no-store');
});
test('tampered bytes fail signature verification', async () => {
  const raw = '{}';
  const timestamp = String(Date.now());
  const signature = createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex');
  const response = await fetch(`${base}/api/webhooks/payment`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-payment-timestamp': timestamp, 'x-payment-signature': signature }, body: raw + ' ' });
  expect(response.status).toBe(401);
});
test('mock confirmation rejects a transaction without preparing DTE', async () => {
  const { order, paymentToken } = await createOrder();
  const response = await fetch(`${base}/api/checkout/mock-confirm`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: order.id, paymentToken, outcome: 'reject' }) });
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.order.status).toBe('failed');
  expect(data.order.dte39).toBeNull();
});
