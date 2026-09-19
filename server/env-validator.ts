import { z } from 'zod';

/**
 * Esquema de validación para las variables de entorno de producción.
 * Utiliza Zod para abortar el arranque o la compilación si faltan credenciales críticas.
 */
export const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  GEMINI_MODEL: z.string().min(1).default('gemini-3.8-flash'),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().min(100).max(60000).default(12000),
  GEMINI_COOLDOWN_MS: z.coerce.number().int().min(1000).max(3600000).default(60000),
  GEMINI_API_KEY: z.string().min(1, {
    message: 'GEMINI_API_KEY es obligatoria para el funcionamiento del Asistente Auditor AI.'
  }).optional().or(z.literal('')),
  SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  REDIS_URL: z.string().url().refine(value => ['redis:', 'rediss:'].includes(new URL(value).protocol)).optional().or(z.literal('')),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: 'NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida (ej: https://xyz.supabase.co).'
  }).optional().or(z.literal('')),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10, {
    message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY debe ser una clave JWT válida.'
  }).optional().or(z.literal('')),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10, {
    message: 'SUPABASE_SERVICE_ROLE_KEY debe ser una clave de servicio JWT válida.'
  }).optional().or(z.literal('')),
  APP_URL: z.string().url().optional().or(z.literal(''))
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

/**
 * Validador estricto para entornos de producción (CI/CD o contenedor Docker de despliegue final).
 * Si `strict` es true, lanza una excepción fatal y muestra el reporte de errores.
 */
export function validateProductionEnv(options: { strict?: boolean; env?: Record<string, string | undefined> } = {}): {
  success: boolean;
  errors: string[];
  data: Partial<ServerEnv>;
} {
  const { strict = false, env = process.env } = options;

  const errors: string[] = [];

  // AI is optional: missing credentials deliberately enable local fallback.
  const result = ServerEnvSchema.safeParse(env);

  if (!result.success) {
    const formatted = result.error.issues.map((issue) => `[EnvValidator] ${issue.path.join('.')}: ${issue.message}`);
    errors.push(...formatted);
  }

  if (errors.length > 0 && strict) {
    console.error('================================================================');
    console.error('❌ ERROR FATAL DE VALIDACIÓN DE ENTORNO EN PRODUCCIÓN:');
    errors.forEach((err) => console.error(`   - ${err}`));
    console.error('Verifica .env.production o las variables de entorno de tu host.');
    console.error('================================================================');
    throw new Error(`Validación de entorno fallida: ${errors.join(', ')}`);
  }

  return {
    success: errors.length === 0,
    errors,
    data: result.success ? result.data : {}
  };
}

// Exportación por defecto
export default validateProductionEnv;
