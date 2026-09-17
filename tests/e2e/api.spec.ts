import { test, expect } from '@playwright/test';
test('production health and local chat fallback', async ({ request }) => {
  const health = await request.get('/api/health');
  expect(health.ok()).toBe(true);
  expect((await health.json()).environment).toBe('production');
  const chat = await request.post('/api/chat', { data: { message: 'Hola' } });
  expect(chat.ok()).toBe(true);
  expect((await chat.json()).text.length).toBeGreaterThan(0);
});
test('invalid chat and search input return JSON 400', async ({ request }) => {
  for (const data of [{ message: ' ' }, { message: 'hola', conversationHistory: [null] }]) {
    expect((await request.post('/api/chat', { data })).status()).toBe(400);
  }
  expect((await request.get('/api/market-insights?topic=unknown')).status()).toBe(400);
  expect((await request.get('/api/market-insights?q[a]=x')).status()).toBe(400);
});
test('unknown API path does not fall through to HTML', async ({ request }) => {
  const response = await request.get('/api/missing');
  expect(response.status()).toBe(404);
  expect(response.headers()['content-type']).toContain('application/json');
});
test('server code and environment cannot be downloaded', async ({ request }) => {
  for (const path of ['/server.js', '/server.cjs', '/.env.local', '/server.js.map']) {
    const response = await request.get(path);
    expect(response.headers()['content-type']).toContain('text/html');
    expect(await response.text()).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
  }
});
test('event ingestion requires server credentials', async ({ request }) => {
  const response = await request.post('/api/v1/events', { data: { eventId: 'test', eventName: 'purchase', grossAmountCLP: 100 } });
  expect([401, 503]).toContain(response.status());
});
test('cached market references remain available', async ({ request }) => {
  const response = await request.get('/api/market-insights');
  expect(response.ok()).toBe(true);
  expect((await response.json()).news.length).toBeGreaterThan(0);
});
