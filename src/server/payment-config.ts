import path from 'node:path';
import { z } from 'zod';

const schema = z.object({
  PAYMENT_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  WEBPAY_COMMERCE_CODE: z.string().trim().default(''),
  WEBPAY_API_KEY: z.string().trim().default(''),
  APP_URL: z.string().default(''),
  RENDER_EXTERNAL_URL: z.string().default(''),
  PAYMENT_STORE_DIR: z.string().default(''),
  PAYMENT_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(10000),
  CORS_ALLOWED_ORIGINS: z.string().default(''),
});
export function paymentConfig(env: Record<string, string | undefined> = process.env) {
  const parsed = schema.safeParse(env);
  if (!parsed.success) throw new Error(`Configuración de pagos inválida: ${parsed.error.issues.map(i => i.path.join('.')).join(', ')}`);
  const values = parsed.data;
  const enabled = Boolean(values.WEBPAY_COMMERCE_CODE && values.WEBPAY_API_KEY);
  const appUrl = values.APP_URL || values.RENDER_EXTERNAL_URL || 'http://localhost:3000';
  const origin = new URL(appUrl);
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) throw new Error('APP_URL debe ser un origen HTTP(S), sin ruta ni credenciales');
  if (enabled && values.PAYMENT_ENV === 'production') {
    if (origin.protocol !== 'https:') throw new Error('Webpay production requiere APP_URL con HTTPS');
    if (!values.PAYMENT_STORE_DIR || !path.isAbsolute(values.PAYMENT_STORE_DIR)) throw new Error('Webpay production requiere PAYMENT_STORE_DIR absoluto en un disco persistente');
  }
  const corsOrigins = [origin.origin, ...values.CORS_ALLOWED_ORIGINS.split(',').map(value => value.trim()).filter(Boolean)];
  for (const value of corsOrigins) {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.origin !== value) throw new Error('CORS_ALLOWED_ORIGINS debe contener orígenes exactos HTTP(S), sin comodines');
  }
  return {
    environment: values.PAYMENT_ENV, mode: enabled ? values.PAYMENT_ENV : 'mock' as const,
    commerceCode: values.WEBPAY_COMMERCE_CODE, apiKey: values.WEBPAY_API_KEY,
    appOrigin: origin.origin, corsOrigins: new Set(corsOrigins), timeoutMs: values.PAYMENT_TIMEOUT_MS,
    storeDir: path.resolve(values.PAYMENT_STORE_DIR || '.data/payments', values.PAYMENT_ENV),
    fallbackReason: enabled ? undefined : 'Credenciales Webpay ausentes o incompletas; simulador local activo',
  };
}
export type PaymentConfig = ReturnType<typeof paymentConfig>;
