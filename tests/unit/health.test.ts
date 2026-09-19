import { afterEach, expect, test, vi } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { healthHandler, checkRedisHealth } from '../../server/health';
import { checkSupabaseAdminHealth } from '../../server/supabase-admin';
import { createClient } from 'redis';
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });
const up = { configured: true, healthy: true, latencyMs: 1 };

test.each([
  [up, up, 200],
  [up, { ...up, healthy: false }, 503],
  [{ ...up, configured: false, healthy: false }, up, 503],
  [{ ...up, healthy: false }, up, 503],
])('readiness reports actual dependency health %#', async (db, redis, status) => {
  const app = express(); app.get('/health', healthHandler(async () => db, async () => redis));
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  try {
    const res = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/health`);
    expect(res.status).toBe(status); expect(res.headers.get('cache-control')).toBe('no-store');
    expect((await res.json()).services.redis).toEqual(redis);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});

test.each([200, 401, 404, 503])('Supabase probes actual payment table and respects HTTP %s', async status => {
  vi.stubEnv('SUPABASE_URL', 'https://db.example.com'); vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-secret');
  const request = vi.fn(async (_url: string, _options: RequestInit) => new Response('[]', { status })); vi.stubGlobal('fetch', request);
  expect((await checkSupabaseAdminHealth()).healthy).toBe(status === 200);
  expect(request.mock.calls[0][0]).toBe('https://db.example.com/rest/v1/payment_orders?select=id&limit=1');
});

test('Redis actively connects, pings and destroys connection', async () => {
  const client = { isOpen: true, on: vi.fn(), connect: vi.fn(async () => {}), ping: vi.fn(async () => 'PONG'), destroy: vi.fn() };
  const factory = vi.fn(() => client) as unknown as typeof createClient;
  expect((await checkRedisHealth('redis://localhost:6379', factory)).healthy).toBe(true);
  expect(client.connect).toHaveBeenCalledOnce(); expect(client.ping).toHaveBeenCalledOnce(); expect(client.destroy).toHaveBeenCalledOnce();
  client.ping.mockRejectedValueOnce(new Error('Disconnected'));
  expect((await checkRedisHealth('redis://localhost:6379', factory)).healthy).toBe(false);
});

test('Redis hung PING times out and closes its socket', async () => {
  vi.useFakeTimers();
  const client = { isOpen: true, on: vi.fn(), connect: vi.fn(async () => {}), ping: vi.fn(() => new Promise(() => {})), destroy: vi.fn() };
  const operation = checkRedisHealth('redis://localhost:6379', (() => client) as unknown as typeof createClient);
  await vi.advanceTimersByTimeAsync(3001);
  expect((await operation).healthy).toBe(false); expect(client.destroy).toHaveBeenCalledOnce();
});
