import express, { type ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { generateShopifyAssets } from '../lib/shopify/instant-generator';

export function createShopifyRouter(generate = generateShopifyAssets) {
  const router = express.Router();
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  router.use(express.json({ limit: '8kb' }));

  for (const kind of ['catalog', 'theme'] as const) {
    router.post(`/download-${kind}`, (req, res) => {
      try {
        const assets = generate(req.body);
        const catalog = kind === 'catalog';
        res.attachment(catalog ? 'catalogo-shopify-chile.csv' : 'tema-shopify-pro-chile.json');
        res.type(catalog ? 'text/csv' : 'application/json');
        res.send(catalog ? assets.csv : JSON.stringify(assets.theme, null, 2) + '\n');
      } catch (error) {
        if (error instanceof ZodError) {
          res.status(400).json({ error: 'Datos del comercio inválidos. Revisa el RUT y los campos de contacto.' });
          return;
        }
        res.status(500).json({ error: 'No se pudo generar el archivo. Inténtalo nuevamente.' });
      }
    });
  }

  const handleBodyError: ErrorRequestHandler = (error, _req, res, next) => {
    if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
      res.status(error.type === 'entity.too.large' ? 413 : 400).json({ error: 'Cuerpo JSON inválido o demasiado grande.' });
      return;
    }
    next(error);
  };
  router.use(handleBodyError);
  return router;
}
