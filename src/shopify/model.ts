import { z } from 'zod';
import { PRODUCTS, validRut } from '../checkout/model';

export const merchantSchema = z.object({
  rut: z.string().trim().max(16).regex(/^(?:\d{7,8}-?[\dkK]|\d{1,2}\.\d{3}\.\d{3}-[\dkK])$/, 'Formato de RUT inválido')
    .refine(validRut, 'Dígito verificador del RUT inválido')
    .transform(value => {
      const compact = value.replace(/[.-]/g, '').toUpperCase();
      return `${compact.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${compact.at(-1)}`;
    }),
  storeName: z.string().trim().min(2).max(100).regex(/^[^\u0000-\u001f\u007f]+$/, 'Nombre inválido').default('Nova Chile Store'),
  email: z.union([z.literal(''), z.string().trim().email().max(254)]).default(''),
  address: z.string().trim().max(200).regex(/^[^\u0000-\u001f\u007f]*$/, 'Dirección inválida').default(''),
}).strict();
export type Merchant = z.infer<typeof merchantSchema>;

// Selección inicial para validar comercialmente; no representa ventas comprobadas.
export const SHOPIFY_CATALOG = [
  { handle: PRODUCTS[0].id, title: PRODUCTS[0].name, priceCLP: PRODUCTS[0].priceCLP, role: 'heroe', description: PRODUCTS[0].description },
  { handle: 'guante-cepillado', title: 'Guante de cepillado para mascotas', priceCLP: 7990, role: 'complementario', description: 'Accesorio para acompañar la rutina de cepillado.' },
  { handle: 'rodillo-quitapelos', title: 'Rodillo quitapelos reutilizable', priceCLP: 9990, role: 'complementario', description: 'Retira pelos de mascotas de superficies textiles compatibles.' },
  { handle: 'comedero-lento', title: 'Comedero de alimentación lenta', priceCLP: 12990, role: 'complementario', description: 'Diseño con divisiones para distribuir el alimento.' },
  { handle: 'bebedero-portatil', title: 'Bebedero portátil para paseos', priceCLP: 14990, role: 'adicional', description: 'Accesorio para ofrecer agua durante los paseos.' },
] as const;
