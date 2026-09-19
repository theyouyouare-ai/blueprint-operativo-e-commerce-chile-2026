import { expect, test } from 'vitest';
import { build } from 'vite';
import { clientBoundary } from '../../server/client-boundary';

test.each(['/project/server/supabase-admin.ts', '/project/src/server/payment-config.ts', '/project/lib/env-validator.ts', '/project/server.ts'])('client build rejects reachable backend module %s', async id => {
  await expect(build({ configFile: false, logLevel: 'silent', plugins: [
    clientBoundary(),
    { name: 'fixture', resolveId(source) { return source === 'fixture' ? id : undefined; }, load() { return 'export const secret = 1;'; } },
  ], build: { write: false, rollupOptions: { input: 'fixture' } } })).rejects.toThrow('Módulo exclusivo del servidor');
});
