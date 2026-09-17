import express from 'express';
import { CheckoutError } from './checkout-service';
import { getPaymentRuntime } from './payment-runtime';

export const checkoutRouter = express.Router();
checkoutRouter.get('/checkout/config', (_req, res) => {
  const { config } = getPaymentRuntime();
  res.set('Cache-Control', 'no-store').json({ mode: config.mode, provider: config.mode === 'mock' ? 'webpay_plus_mock' : 'webpay_plus', reason: config.fallbackReason });
});
// Exact bytes for mock HMAC. URL-encoded GET/POST return for real Webpay.
// No CORS/IP/header alone is trusted as payment evidence: commit/status SDK verifies it.
checkoutRouter.post('/webhooks/payment', express.raw({ type: 'application/json', limit: '16kb' }), express.urlencoded({ extended: false, limit: '16kb' }), async (req, res) => {
  try {
    const runtime = getPaymentRuntime();
    if (runtime.mock) {
      if (!Buffer.isBuffer(req.body)) throw new CheckoutError(415, 'Usa Content-Type application/json');
      const order = runtime.mock.webhook(req.body.toString('utf8'), req.get('x-payment-signature') ?? null, req.get('x-payment-timestamp') ?? null);
      res.set('Cache-Control', 'no-store').json({ order });
    } else {
      let body = req.body;
      if (Buffer.isBuffer(body)) { try { body = JSON.parse(body.toString('utf8')); } catch { throw new CheckoutError(400, 'JSON inválido'); } }
      const order = await runtime.live!.callback(body);
      res.set('Cache-Control', 'no-store');
      if (req.is('application/x-www-form-urlencoded')) res.redirect(303, `${runtime.config.appOrigin}/checkout?orderId=${order.id}`);
      else res.json({ order });
    }
  } catch (error) {
    if (req.is('application/x-www-form-urlencoded') && getPaymentRuntime().live) {
      res.set('Cache-Control', 'no-store').redirect(303, `${getPaymentRuntime().config.appOrigin}/checkout?payment=verification_pending`);
    } else respondError(error, res);
  }
});
checkoutRouter.get('/webhooks/payment', async (req, res) => {
  const runtime = getPaymentRuntime();
  if (!runtime.live) { res.status(405).json({ error: 'El simulador utiliza POST' }); return; }
  try {
    const order = await runtime.live.callback(req.query);
    res.set('Cache-Control', 'no-store').redirect(303, `${runtime.config.appOrigin}/checkout?orderId=${order.id}`);
  } catch { res.set('Cache-Control', 'no-store').redirect(303, `${runtime.config.appOrigin}/checkout?payment=verification_pending`); }
});
checkoutRouter.use('/checkout', express.json({ limit: '16kb' }));
checkoutRouter.post('/checkout/process', async (req, res) => {
  try {
    const runtime = getPaymentRuntime();
    const service = runtime.live ?? runtime.mock!;
    res.set('Cache-Control', 'no-store').json(await service.process(req.body, req.get('idempotency-key') ?? null));
  } catch (error) { respondError(error, res); }
});
checkoutRouter.post('/checkout/mock-confirm', (req, res) => {
  try {
    const { mock } = getPaymentRuntime();
    if (!mock) throw new CheckoutError(403, 'Simulación deshabilitada con Webpay configurado');
    res.set('Cache-Control', 'no-store').json({ order: mock.mockConfirmation(req.body) });
  } catch (error) { respondError(error, res); }
});
checkoutRouter.get('/checkout/status/:orderId', async (req, res) => {
  try {
    const runtime = getPaymentRuntime();
    const token = (req.get('authorization') || '').replace(/^Bearer /, '');
    res.set('Cache-Control', 'no-store').json({ order: await (runtime.live ?? runtime.mock!).status(String(req.params.orderId), token) });
  } catch (error) { respondError(error, res); }
});
function respondError(error: unknown, res: express.Response) {
  res.set('Cache-Control', 'no-store').status(error instanceof CheckoutError ? error.status : 500).json({ error: error instanceof CheckoutError ? error.message : 'No se pudo procesar el pago' });
}
