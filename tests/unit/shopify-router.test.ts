import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createShopifyRouter } from '../../server/shopify-router';
import { generateShopifyAssets } from '../../lib/shopify/instant-generator';

let server: Server;
let base: string;
const generate = vi.fn(generateShopifyAssets);
beforeAll(async () => {
  const app = express();
  app.use('/api/shopify', createShopifyRouter(generate));
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/shopify`;
});
afterAll(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));

function download(kind: 'catalog' | 'theme', body: unknown = { rut: '12345678-5', storeName: 'Mascotas Chile' }) {
  return fetch(`${base}/download-${kind}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}

test('descarga CSV y JSON en memoria con MIME, adjunto y sin caché', async () => {
  for (const kind of ['catalog', 'theme'] as const) {
    const response = await download(kind);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('content-type')).toContain(`${kind === 'catalog' ? 'text/csv' : 'application/json'}; charset=utf-8`);
    expect(response.headers.get('content-disposition')).toBe(`attachment; filename="${kind === 'catalog' ? 'catalogo-shopify-chile.csv' : 'tema-shopify-pro-chile.json'}"`);
    if (kind === 'catalog') expect((await response.text()).trim().split('\r\n')).toHaveLength(6);
    else {
      const theme = await response.json();
      expect(theme.rut).toBe('12.345.678-5');
      expect(theme.store_name).toBe('Mascotas Chile');
      expect(theme.legal_policies.warranty).toContain(theme.rut);
    }
  }
});

test.each([null, {}, { rut: '12345678-9' }, { rut: ['12345678-5'] }, { rut: '12345678-5', unknown: true }])('rechaza cuerpo inválido en ambas descargas %#', async body => {
  for (const kind of ['catalog', 'theme'] as const) {
    const response = await download(kind, body);
    expect(response.status).toBe(400);
    expect(response.headers.get('content-disposition')).toBeNull();
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect((await response.json()).error).toEqual(expect.any(String));
  }
});

test('rechaza JSON truncado y cuerpos que superan el límite', async () => {
  for (const [body, status] of [['{', 400], [JSON.stringify({ rut: 'x'.repeat(9000) }), 413]] as const) {
    const response = await fetch(`${base}/download-theme`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    expect(response.status).toBe(status);
    expect((await response.json()).error).toEqual(expect.any(String));
  }
});

test('controla errores internos sin exponer datos y permite recuperarse', async () => {
  generate.mockImplementationOnce(() => { throw new Error('detalle privado'); });
  const response = await download('theme');
  expect(response.status).toBe(500);
  expect(response.headers.get('content-disposition')).toBeNull();
  expect(await response.text()).not.toContain('detalle privado');
  expect((await download('theme')).status).toBe(200);
});
