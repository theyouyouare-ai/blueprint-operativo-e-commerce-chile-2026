import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import express from 'express';
import type { Server } from 'node:http';
import { paymentConfig } from '../server/payment-config';
import { paymentCors } from '../server/payment-cors';
import { WebpayCheckoutService } from '../server/webpay-checkout';

const directories: string[] = [];
afterEach(() => { for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true }); });
const input = {
  items: [{ productId: 'cepillo-vapor', quantity: 1 }],
  customer: { name: 'Prueba Webpay', documentType: 'RUT', document: '12345678-5', email: 'test@example.com', phone: '+56912345678', address: 'Calle Prueba 123', commune: 'Santiago', region: 'Metropolitana' },
};
function setup() {
  const dir = mkdtempSync(path.join(tmpdir(), 'blueprint-webpay-')); directories.push(dir);
  const config = paymentConfig({ PAYMENT_ENV: 'sandbox', WEBPAY_COMMERCE_CODE: 'test-code', WEBPAY_API_KEY: 'test-key', APP_URL: 'https://shop.example.com', PAYMENT_STORE_DIR: dir });
  let details = { buy_order: '', session_id: '', amount: 0 };
  const bank = {
    create: vi.fn(async (buy_order: string, session_id: string, amount: number, _returnUrl: string) => { details = { buy_order, session_id, amount }; return { token: 'a'.repeat(64), url: 'https://webpay3gint.transbank.cl/webpayserver/initTransaction' }; }),
    commit: vi.fn(async (_token: string) => ({ ...details, status: 'AUTHORIZED', response_code: 0 })),
    status: vi.fn(async (_token: string) => ({ ...details, status: 'AUTHORIZED', response_code: 0 })),
  };
  return { config, bank, service: new WebpayCheckoutService(config, bank) };
}
test('missing/partial credentials transparently selects mock, full keys select SDK', () => {
  expect(paymentConfig({}).mode).toBe('mock');
  expect(paymentConfig({ PAYMENT_ENV: 'production' }).mode).toBe('mock');
  expect(paymentConfig({ WEBPAY_COMMERCE_CODE: 'one' }).mode).toBe('mock');
  expect(setup().config.mode).toBe('sandbox');
});
test('production requires HTTPS and explicit persistent storage', () => {
  const env = { PAYMENT_ENV: 'production', WEBPAY_COMMERCE_CODE: 'code', WEBPAY_API_KEY: 'key' };
  expect(() => paymentConfig(env)).toThrow('HTTPS');
  expect(() => paymentConfig({ ...env, APP_URL: 'https://shop.example.com' })).toThrow('PAYMENT_STORE_DIR');
  expect(paymentConfig({ ...env, APP_URL: 'https://shop.example.com', PAYMENT_STORE_DIR: '/var/data/payments' }).mode).toBe('production');
});
test('invalid payment environment and wildcard CORS are rejected', () => {
  expect(() => paymentConfig({ PAYMENT_ENV: 'prod' })).toThrow();
  expect(() => paymentConfig({ CORS_ALLOWED_ORIGINS: '*' })).toThrow();
});
test('durable idempotency prevents duplicate creation across restart and concurrent calls', async () => {
  const { config, bank, service } = setup();
  const [first, second] = await Promise.all([service.process(input, 'idempotency-key-001'), service.process(input, 'idempotency-key-001')]);
  expect(first).toEqual(second); expect(bank.create).toHaveBeenCalledTimes(1);
  const restored = new WebpayCheckoutService(config, bank);
  expect(await restored.process(input, 'idempotency-key-001')).toEqual(first);
  expect(bank.create).toHaveBeenCalledTimes(1);
  expect(bank.create.mock.calls[0][3]).toBe('https://shop.example.com/api/webhooks/payment');
});
test('verified commit persists paid state and DTE amounts, repeated callback is idempotent', async () => {
  const { config, bank, service } = setup();
  const session = await service.process(input, 'idempotency-key-001');
  const paid = await service.callback({ token_ws: session.redirect!.token });
  expect(paid.status).toBe('paid'); expect(paid.mode).toBe('sandbox');
  expect(paid.dte39!.IVA + paid.dte39!.MntNeto).toBe(28790);
  const restored = new WebpayCheckoutService(config, bank);
  expect(await restored.callback({ token_ws: session.redirect!.token })).toEqual(paid);
  expect(bank.commit).toHaveBeenCalledTimes(1);
});
test('uncertain commit reconciles against bank status instead of simulating success', async () => {
  const { bank, service } = setup();
  const session = await service.process(input, 'idempotency-key-001');
  bank.commit.mockRejectedValueOnce(new Error('timeout'));
  expect((await service.callback({ token_ws: session.redirect!.token })).status).toBe('paid');
  expect(bank.status).toHaveBeenCalledTimes(1);
});
test('mismatched amount/order/session does not mark payment paid', async () => {
  const { bank, service } = setup();
  const session = await service.process(input, 'idempotency-key-001');
  bank.commit.mockResolvedValueOnce({ buy_order: 'wrong', session_id: 'wrong', amount: 1, status: 'AUTHORIZED', response_code: 0 });
  await expect(service.callback({ token_ws: session.redirect!.token })).rejects.toMatchObject({ status: 502 });
});
test('forged token fails without contacting the gateway', async () => {
  const { bank, service } = setup();
  await service.process(input, 'idempotency-key-001');
  await expect(service.callback({ token_ws: 'forged' })).rejects.toMatchObject({ status: 404 });
  expect(bank.commit).not.toHaveBeenCalled();
});
test('cancel return only queries status and never commits', async () => {
  const { bank, service } = setup();
  const session = await service.process(input, 'idempotency-key-001');
  await service.callback({ TBK_TOKEN: session.redirect!.token });
  expect(bank.commit).not.toHaveBeenCalled(); expect(bank.status).toHaveBeenCalledTimes(1);
});
test('SDK creation errors do not downgrade to mock or trigger another create on retry', async () => {
  const { bank, service } = setup();
  bank.create.mockRejectedValueOnce(new Error('Unauthorized'));
  await expect(service.process(input, 'idempotency-key-001')).rejects.toMatchObject({ status: 502 });
  await expect(service.process(input, 'idempotency-key-001')).rejects.toMatchObject({ status: 503 });
  expect(bank.create).toHaveBeenCalledTimes(1);
});
test('browser CORS allowlist permits HTTPS provider callback without trusting its origin', async () => {
  const app = express();
  app.use(paymentCors(paymentConfig({ APP_URL: 'https://shop.example.com' })));
  app.use((_req, res) => { res.json({ ok: true }); });
  const server = await new Promise<Server>(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  const address = server.address() as { port: number };
  const url = `http://127.0.0.1:${address.port}`;
  try {
    const allowed = await fetch(`${url}/checkout/process`, { method: 'OPTIONS', headers: { Origin: 'https://shop.example.com' } });
    expect(allowed.status).toBe(204); expect(allowed.headers.get('access-control-allow-origin')).toBe('https://shop.example.com');
    expect((await fetch(`${url}/checkout/process`, { headers: { Origin: 'https://evil.example.com' } })).status).toBe(403);
    const callback = await fetch(`${url}/webhooks/payment`, { method: 'POST', headers: { Origin: 'https://webpay3g.transbank.cl' } });
    expect(callback.status).toBe(200); expect(callback.headers.get('access-control-allow-origin')).toBeNull();
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
