import { z } from 'zod';

export const PRODUCTS = [
  { id: 'cepillo-vapor', name: 'Cepillo de vapor para mascotas', priceCLP: 24990, description: 'Cuidado diario para tu mascota.', icon: '🐾' },
  { id: 'espatula-ultrasonica', name: 'Espátula ultrasónica', priceCLP: 29990, description: 'Tu rutina de cuidado facial en casa.', icon: '✨' },
  { id: 'lampara-levitante', name: 'Lámpara levitante', priceCLP: 49990, description: 'Iluminación para tu espacio favorito.', icon: '💡' },
] as const;
export const SHIPPING_CLP = 3800;
export const FREE_SHIPPING_FROM_CLP = 49990;
export const clp = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
export type CartItem = { productId: string; quantity: number };
export const cartSchema = z.array(z.object({ productId: z.enum(['cepillo-vapor', 'espatula-ultrasonica', 'lampara-levitante']), quantity: z.number().int().min(1).max(10) }).strict()).min(1).max(3).refine(items => new Set(items.map(item => item.productId)).size === items.length, 'Productos duplicados');

export function validRut(value: string): boolean {
  const rut = value.replace(/[.\-\s]/g, '').toUpperCase();
  if (!/^\d{7,8}[\dK]$/.test(rut) || /^0+$/.test(rut.slice(0, -1))) return false;
  const body = rut.slice(0, -1);
  const sum = [...body].reverse().reduce((total, digit, index) => total + Number(digit) * (2 + index % 6), 0);
  const result = 11 - sum % 11;
  return rut.at(-1) === (result === 11 ? '0' : result === 10 ? 'K' : String(result));
}
export const customerSchema = z.object({
  name: z.string().trim().min(3).max(100),
  documentType: z.enum(['RUT', 'DNI']),
  document: z.string().trim().min(4).max(24),
  email: z.string().trim().email().max(254),
  phone: z.string().transform(value => value.replace(/[\s()-]/g, '')).pipe(z.string().regex(/^\+569\d{8}$/, 'Usa +569 seguido de 8 dígitos')),
  address: z.string().trim().min(5).max(200),
  commune: z.string().trim().min(2).max(80),
  region: z.string().trim().min(2).max(80),
}).strict().superRefine((customer, ctx) => {
  if (customer.documentType === 'RUT' ? !validRut(customer.document) : !/^[A-Za-z0-9-]{4,24}$/.test(customer.document)) {
    ctx.addIssue({ code: 'custom', path: ['document'], message: 'RUT o DNI inválido' });
  }
});
export const checkoutSchema = z.object({ items: cartSchema, customer: customerSchema }).strict();
export type Customer = z.infer<typeof customerSchema>;

/** Gross prices include IVA. Integer peso arithmetic keeps net + IVA = total.
 * Reference: https://www.sii.cl/factura_electronica/libros_boletas.pdf
 * Mock assumption: shipping is part of the taxable sale, with no exempt items.
 */
export function calculateTotals(items: CartItem[]) {
  const validated = cartSchema.parse(items);
  const productsGrossCLP = validated.reduce((total, item) => total + PRODUCTS.find(product => product.id === item.productId)!.priceCLP * item.quantity, 0);
  const shippingGrossCLP = productsGrossCLP >= FREE_SHIPPING_FROM_CLP ? 0 : SHIPPING_CLP;
  const totalCLP = productsGrossCLP + shippingGrossCLP;
  const netCLP = Math.round(totalCLP * 100 / 119);
  const shippingNetCLP = Math.round(shippingGrossCLP * 100 / 119);
  return { productsGrossCLP, shippingGrossCLP, productsNetCLP: netCLP - shippingNetCLP, shippingNetCLP, netCLP, ivaCLP: totalCLP - netCLP, totalCLP, currency: 'CLP' as const };
}
export type Totals = ReturnType<typeof calculateTotals>;
export type PublicOrder = {
  id: string; status: 'pending' | 'paid' | 'failed' | 'expired'; mode: 'mock' | 'sandbox' | 'production'; provider: 'webpay_plus_mock' | 'webpay_plus';
  totals: Totals; createdAt: string; expiresAt: string;
  dte39: null | { type: 39; status: 'ready_for_issuance'; MntNeto: number; IVA: number; MntTotal: number };
};
export type CheckoutSession = { order: PublicOrder; paymentToken: string; redirect?: { url: string; token: string } };
