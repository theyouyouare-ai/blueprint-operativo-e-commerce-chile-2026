import type { RequestHandler } from 'express';
import type { PaymentConfig } from './payment-config';
/** CORS governs browser fetch only. Provider navigation/callbacks are verified by the SDK. */
export function paymentCors(config: PaymentConfig): RequestHandler {
  return (req, res, next) => {
    const origin = req.get('origin');
    res.vary('Origin');
    if (origin && config.corsOrigins.has(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
      res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
      res.set('Access-Control-Max-Age', '600');
    } else if (origin && !['/webhooks/payment', '/webhooks/mercadopago'].includes(req.path)) {
      res.status(403).json({ error: 'Origen no permitido' }); return;
    }
    if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
    next();
  };
}
