import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { createHmac } from 'node:crypto';
import { checkoutRouter } from '../server/checkout-router';
import { MercadoPagoCheckoutService, type PaymentRow } from '../server/mercadopago-checkout';
import { paymentConfig } from '../server/payment-config';
import { paymentCors } from '../server/payment-cors';
import { getPaymentRuntime } from '../server/payment-runtime';
vi.mock('../server/payment-runtime', () => ({ getPaymentRuntime: vi.fn() }));
const config = paymentConfig({ MERCADOPAGO_ACCESS_TOKEN: 'test-token', MERCADOPAGO_WEBHOOK_SECRET: 'secret', SUPABASE_URL: 'https://db.example.com', SUPABASE_SERVICE_ROLE_KEY: 'key', REDIS_URL: 'redis://localhost:6379', APP_URL: 'https://shop.example.com' });
const lock = { acquire: vi.fn(async () => true), release: vi.fn(async () => {}) };
const store = { find: vi.fn(async (): Promise<PaymentRow | undefined> => undefined), insert: vi.fn(async () => true), patch: vi.fn(async () => {}) };
const request = vi.fn(async () => new Response('{}', { status: 503 }));
const service = new MercadoPagoCheckoutService(config, store, lock, request);
let server: Server;
let base: string;
beforeAll(async () => {
  vi.mocked(getPaymentRuntime).mockReturnValue({ config, mp: service, live: undefined, mock: undefined });
  const app = express(); app.use('/api', paymentCors(config), checkoutRouter);
  server = await new Promise<Server>(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  const address = server.address(); base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;
});
afterAll(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });

test('HTTP route rejects missing/tampered URL signatures before provider access', async () => {
  const response = await fetch(`${base}/api/webhooks/mercadopago?data.id=123`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: { id: 123 }, status: 'approved' }) });
  expect(response.status).toBe(401); expect(lock.acquire).not.toHaveBeenCalled();
});
test('signed URL reaches provider regardless of untrusted body; upstream outage returns retriable error', async () => {
  const ts = '1704908010'; const id = 'request-123';
  const digest = createHmac('sha256', 'secret').update(`id:123;request-id:${id};ts:${ts};`).digest('hex');
  const response = await fetch(`${base}/api/webhooks/mercadopago?data.id=123`, { method: 'POST', headers: { Origin: 'https://www.mercadopago.cl', 'Content-Type': 'application/json', 'x-request-id': id, 'x-signature': `ts=${ts},v1=${digest}` }, body: JSON.stringify({ data: { id: 999 }, status: 'approved' }) });
  expect(response.status).toBe(502); expect(request).toHaveBeenCalledWith('https://api.mercadopago.com/v1/payments/123', expect.any(Object));
  expect(store.patch).not.toHaveBeenCalled(); expect(lock.release).toHaveBeenCalled();
});
test('MP runtime disables mock confirmation and exposes correct provider without secrets', async () => {
  const response = await fetch(`${base}/api/checkout/mock-confirm`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  expect(response.status).toBe(403);
  const status = await fetch(`${base}/api/checkout/config`);
  expect(await status.json()).toEqual({ mode: 'sandbox', provider: 'mercadopago' });
});
