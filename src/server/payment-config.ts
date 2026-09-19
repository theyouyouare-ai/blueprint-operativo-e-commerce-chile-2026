import path from 'node:path';
import { z } from 'zod';

const schema = z.object({
  PAYMENT_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  MERCADOPAGO_ACCESS_TOKEN: z.string().trim().default(''),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().trim().default(''),
  SUPABASE_URL: z.string().default(''),
  NEXT_PUBLIC_SUPABASE_URL: z.string().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
  REDIS_URL: z.string().default(''),
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
  const provider = values.MERCADOPAGO_ACCESS_TOKEN ? 'mercadopago' as const : 'webpay_plus' as const;
  const enabled = Boolean(values.MERCADOPAGO_ACCESS_TOKEN || (values.WEBPAY_COMMERCE_CODE && values.WEBPAY_API_KEY));
  const supabaseUrl = values.SUPABASE_URL || values.NEXT_PUBLIC_SUPABASE_URL;
  if (provider === 'mercadopago') {
    if (!values.MERCADOPAGO_WEBHOOK_SECRET || !supabaseUrl || !values.SUPABASE_SERVICE_ROLE_KEY || !values.REDIS_URL) throw new Error('Mercado Pago requiere webhook secret, Supabase y REDIS_URL');
    if (new URL(supabaseUrl).protocol !== 'https:') throw new Error('Supabase requiere HTTPS');
    if (!['redis:', 'rediss:'].includes(new URL(values.REDIS_URL).protocol)) throw new Error('REDIS_URL inválido');
  }
  const appUrl = values.APP_URL || values.RENDER_EXTERNAL_URL || 'http://localhost:3000';
  const origin = new URL(appUrl);
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) throw new Error('APP_URL debe ser un origen HTTP(S), sin ruta ni credenciales');
  if (enabled && values.PAYMENT_ENV === 'production') {
    if (origin.protocol !== 'https:') throw new Error('Pagos production requieren APP_URL con HTTPS');
    if (provider === 'webpay_plus' && (!values.PAYMENT_STORE_DIR || !path.isAbsolute(values.PAYMENT_STORE_DIR))) throw new Error('Webpay production requiere PAYMENT_STORE_DIR absoluto en un disco persistente');
  }
  const corsOrigins = [origin.origin, ...values.CORS_ALLOWED_ORIGINS.split(',').map(value => value.trim()).filter(Boolean)];
  for (const value of corsOrigins) {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.origin !== value) throw new Error('CORS_ALLOWED_ORIGINS debe contener orígenes exactos HTTP(S), sin comodines');
  }
  return {
    provider, mpAccessToken: values.MERCADOPAGO_ACCESS_TOKEN, mpWebhookSecret: values.MERCADOPAGO_WEBHOOK_SECRET,
    supabaseUrl: supabaseUrl.replace(/\/$/, ''), supabaseKey: values.SUPABASE_SERVICE_ROLE_KEY, redisUrl: values.REDIS_URL,
    environment: values.PAYMENT_ENV, mode: enabled ? values.PAYMENT_ENV : 'mock' as const,
    commerceCode: values.WEBPAY_COMMERCE_CODE, apiKey: values.WEBPAY_API_KEY,
    appOrigin: origin.origin, corsOrigins: new Set(corsOrigins), timeoutMs: values.PAYMENT_TIMEOUT_MS,
    storeDir: path.resolve(values.PAYMENT_STORE_DIR || '.data/payments', values.PAYMENT_ENV),
    fallbackReason: enabled ? undefined : 'Credenciales de pago ausentes o incompletas; simulador local activo',
  };
}
export type PaymentConfig = ReturnType<typeof paymentConfig>;
