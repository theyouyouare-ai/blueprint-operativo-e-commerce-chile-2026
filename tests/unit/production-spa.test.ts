import { test, expect } from 'vitest';
import express from 'express';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { productionSpa } from '../../server/production-spa';

test('production serves SPA routes, correct MIME types and never HTML for missing assets', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'spa-test-'));
  mkdirSync(path.join(directory, 'assets'));
  const html = '<div id="root"></div><script type="module" src="/assets/app.js"></script><link rel="stylesheet" href="/assets/app.css">';
  writeFileSync(path.join(directory, 'index.html'), html);
  writeFileSync(path.join(directory, 'assets/app.js'), 'console.log("ready")');
  writeFileSync(path.join(directory, 'assets/app.css'), 'body { color: black }');
  const app = express();
  app.use(productionSpa(directory));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    for (const route of ['/', '/checkout', '/checkout/return', '/index.html']) {
      const response = await fetch(base + route, { headers: { Accept: 'text/html' } });
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.text()).toBe(html);
    }
    for (const [asset, mime] of [['app.js', 'javascript'], ['app.css', 'text/css']]) {
      const response = await fetch(`${base}/assets/${asset}`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain(mime);
      expect(response.headers.get('cache-control')).toContain('immutable');
    }
    for (const route of ['/assets/old.js', '/assets/old.css', '/server.js', '/.env.local']) {
      const response = await fetch(base + route);
      expect(response.status).toBe(404);
      expect(response.headers.get('content-type')).not.toContain('text/html');
    }
    expect((await fetch(`${base}/unknown`, { headers: { Accept: 'application/json' } })).status).toBe(404);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    rmSync(directory, { recursive: true, force: true });
  }
});

test('missing or incomplete client builds fail startup', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'spa-test-'));
  try {
    expect(() => productionSpa(directory)).toThrow();
    writeFileSync(path.join(directory, 'index.html'), '<script src="/src/main.tsx"></script>');
    expect(() => productionSpa(directory)).toThrow('Build de Vite inválido');
    writeFileSync(path.join(directory, 'index.html'), '<script src="/assets/missing.js"></script>');
    expect(() => productionSpa(directory)).toThrow('Falta un activo');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
