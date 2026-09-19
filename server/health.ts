import type { RequestHandler } from 'express';
import { createClient } from 'redis';
import { checkSupabaseAdminHealth } from './supabase-admin';

export type DependencyHealth = { configured: boolean; healthy: boolean; latencyMs: number };
export async function checkRedisHealth(url = process.env.REDIS_URL, factory = createClient): Promise<DependencyHealth> {
  if (!url) return { configured: false, healthy: false, latencyMs: 0 };
  const start = Date.now();
  let client: ReturnType<typeof createClient> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    client = factory({ url, disableOfflineQueue: true, socket: { connectTimeout: 2000, reconnectStrategy: false } });
    client.on('error', () => {});
    const connection = client;
    const pong = await Promise.race([
      (async () => { await connection.connect(); return connection.ping(); })(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Health timeout')), 3000); }),
    ]);
    return { configured: true, healthy: pong === 'PONG', latencyMs: Date.now() - start };
  } catch {
    return { configured: true, healthy: false, latencyMs: Date.now() - start };
  } finally {
    if (timer) clearTimeout(timer);
    if (client?.isOpen) client.destroy();
  }
}

export function healthHandler(
  supabase = checkSupabaseAdminHealth,
  redis: () => Promise<DependencyHealth> = checkRedisHealth,
): RequestHandler {
  return async (_req, res) => {
    const probes = await Promise.allSettled([supabase(), redis()]);
    const checks = probes.map(result => result.status === 'fulfilled' ? result.value : { configured: true, healthy: false, latencyMs: 0 });
    const healthy = checks.every(check => check.configured && check.healthy);
    res.set('Cache-Control', 'no-store').status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'unavailable', environment: process.env.NODE_ENV || 'development',
      services: { supabaseAdmin: checks[0], redis: checks[1] },
    });
  };
}
