import type { Plugin } from 'vite';
/** Fail the client build/dev import graph if a server-only module becomes reachable. */
export function clientBoundary(): Plugin {
  return {
    name: 'client-server-boundary',
    enforce: 'pre',
    load(id) {
      const file = id.replaceAll('\\', '/').split('?')[0];
      if (file.includes('/node_modules/')) return;
      if (/\/(?:src\/server|server)\//.test(file) || /\/(?:server|supabase-admin|env-validator)\.[cm]?[jt]s$/.test(file)) {
        throw new Error('Módulo exclusivo del servidor importado por el cliente');
      }
    },
  };
}
