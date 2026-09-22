import { test, expect } from 'vitest';
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

test('el bundle ESM carga y construye el SDK CommonJS con Node nativo', async () => {
  // Stay under node_modules so the subprocess can resolve external SDK dependencies.
  const directory = mkdtempSync(path.join(process.cwd(), 'node_modules', '.webpay-runtime-'));
  try {
    const outfile = path.join(directory, 'webpay.mjs');
    await build({
      entryPoints: ['src/server/webpay-checkout.ts'], outfile,
      bundle: true, platform: 'node', format: 'esm', packages: 'external',
    });
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
      import { WebpayCheckoutService } from ${JSON.stringify(pathToFileURL(outfile).href)};
      new WebpayCheckoutService({
        storeDir: ${JSON.stringify(path.join(directory, 'orders'))},
        commerceCode: '', apiKey: '', environment: 'sandbox', timeoutMs: 1000
      });
      console.log('SDK ready');
    `], { encoding: 'utf8', timeout: 10000 });
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe('SDK ready');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
