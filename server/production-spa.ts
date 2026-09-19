import express from 'express';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export function productionSpa(distPath: string) {
  const indexPath = path.join(distPath, 'index.html');
  const html = readFileSync(indexPath, 'utf8');
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)].map((match) => match[1]);
  if (!assets.some((asset) => asset.endsWith('.js'))) {
    throw new Error(`Build de Vite inválido: ${indexPath} no referencia JavaScript en /assets/`);
  }
  for (const asset of assets) {
    if (!existsSync(path.join(distPath, asset))) throw new Error(`Falta un activo de producción: ${asset}`);
  }

  const router = express.Router();
  router.use('/assets', express.static(path.join(distPath, 'assets'), {
    immutable: true, maxAge: '1y', index: false, redirect: false,
  }));
  // Missing chunks must be 404s, never HTML with a JavaScript URL.
  router.use('/assets', (_req, res) => {
    res.status(404).set('Cache-Control', 'no-store').type('text').send('Activo no encontrado');
  });
  router.use(express.static(distPath, {
    index: false, redirect: false,
    setHeaders: (res) => { res.setHeader('Cache-Control', 'no-store'); },
  }));
  router.get('*', (req, res) => {
    if (path.extname(req.path) || !req.accepts('html')) {
      res.status(404).type('text').send('Recurso no encontrado');
      return;
    }
    res.set('Cache-Control', 'no-store').sendFile(indexPath);
  });
  return router;
}
