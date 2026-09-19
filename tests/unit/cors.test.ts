import { expect, test } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { paymentCors } from '../../src/server/payment-cors';
import { paymentConfig } from '../../src/server/payment-config';

test('CORS permits exact configured origins, rejects hostile browser requests and admits provider webhooks', async () => {
  const app = express();
  app.use('/api', paymentCors(paymentConfig({ APP_URL: 'https://shop.example.com', CORS_ALLOWED_ORIGINS: 'https://admin.example.com' })));
  app.post('/api/checkout/create-order', (_req, res) => res.sendStatus(200));
  // Handler stands in for the independent signature verifier; CORS must not authenticate it.
  app.post('/api/webhooks/mercadopago', (_req, res) => res.sendStatus(401));
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    const allowed = await fetch(`${base}/api/checkout/create-order`, { method: 'OPTIONS', headers: { Origin: 'https://admin.example.com', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,idempotency-key' } });
    expect(allowed.status).toBe(204);
    expect(allowed.headers.get('access-control-allow-origin')).toBe('https://admin.example.com');
    expect(allowed.headers.get('access-control-allow-headers')).toContain('Idempotency-Key');
    const hostile = await fetch(`${base}/api/checkout/create-order`, { method: 'POST', headers: { Origin: 'https://shop.example.com.evil.test' } });
    expect(hostile.status).toBe(403);
    for (const headers of [{}, { Origin: 'https://www.mercadopago.cl' }]) {
      const webhook = await fetch(`${base}/api/webhooks/mercadopago`, { method: 'POST', headers });
      expect(webhook.status).toBe(401); // It reached signature validation, not a CORS rejection.
      expect(webhook.headers.get('access-control-allow-origin')).toBeNull();
    }
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
