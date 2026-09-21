import template from './theme-dawn-chile-pro.json';
import { merchantSchema, SHOPIFY_CATALOG } from '../../src/shopify/model';

export const SHOPIFY_SOURCES = {
  csv: 'https://help.shopify.com/en/manual/products/import-export/using-csv',
  themes: 'https://help.shopify.com/en/manual/online-store/themes/adding-themes',
  sii: 'https://www.sii.cl/destacados/iva_bienes/',
  sernac: 'https://www.sernac.cl/portal/604/w3-propertyvalue-20982.html',
};

function html(value: string) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}
function csvCell(value: string | number) {
  const text = String(value);
  // Quotes protect CSV structure; an apostrophe separately neutralizes spreadsheet formulas.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function generateShopifyAssets(input: unknown) {
  const merchant = merchantSchema.parse(input);
  const identity = `<p>Proveedor: ${html(merchant.storeName)} · RUT ${merchant.rut}. Dirección: ${html(merchant.address || '[Completar domicilio del proveedor]')}. Contacto: ${html(merchant.email || '[Completar correo de atención]')}.</p>`;
  const legalPolicies = {
    terms: `<h2>Términos y condiciones</h2>${identity}<p>Precios expresados en pesos chilenos (CLP), con IVA incluido. Antes del pago se informan disponibilidad, costo de envío, total y plazo de despacho. Se envía confirmación escrita de la compra y el comprobante tributario correspondiente.</p><p>Ley N° 21.713: desde el 25 de octubre de 2025, las ventas remotas de bienes desde el extranjero por hasta USD 500 a consumidores finales en Chile están sujetas al régimen de IVA del 19% descrito por el SII. Si el comercio o plataforma extranjero inscrito recauda el IVA, corresponde la exención de IVA y aranceles a la importación bajo los requisitos del régimen. Esto no reemplaza las obligaciones tributarias de un vendedor local ni autoriza a cobrar IVA dos veces.</p><p>Referencia: <a href="${SHOPIFY_SOURCES.sii}">SII: IVA en bienes adquiridos en el extranjero</a>.</p>`,
    returns: `<h2>Devoluciones y derecho a retracto</h2>${identity}<p>En compras a distancia puedes ejercer el retracto dentro de 10 días desde la recepción, antes de usar el producto. Si no recibes confirmación escrita del contrato, el plazo se extiende a 90 días. Solicítalo al contacto indicado y coordina la devolución. Las excepciones legales deben informarse previamente cuando correspondan. Esta política no restringe la garantía legal ni los demás derechos del consumidor.</p>`,
    warranty: `<h2>Garantía legal de 6 meses</h2>${identity}<p>Si un producto nuevo presenta fallas o no cumple las características informadas, dentro de los 6 meses desde su recepción puedes elegir, según corresponda legalmente, reparación gratuita, cambio o devolución del dinero. Presenta un comprobante de compra al contacto del proveedor. Una garantía voluntaria no sustituye estos derechos.</p><p>Referencia: <a href="${SHOPIFY_SOURCES.sernac}">SERNAC: derechos en comercio electrónico</a>.</p>`,
  };
  const headers = ['URL handle', 'Title', 'Description', 'Vendor', 'Type', 'Tags', 'Published on online store', 'Status', 'Option1 name', 'Option1 value', 'SKU', 'Price', 'Charge tax', 'Requires shipping', 'Inventory tracker', 'Inventory quantity', 'Continue selling when out of stock', 'Fulfillment service'];
  const rows = SHOPIFY_CATALOG.map((product, index) => [
    product.handle, product.title, `<p>${html(product.description)}</p><p>Precio en CLP con IVA incluido.</p>`,
    merchant.storeName, 'Accesorios para mascotas', `chile,mascotas,${product.role}`, 'false', 'draft',
    'Title', 'Default Title', `CL-MASC-${String(index + 1).padStart(3, '0')}`, product.priceCLP,
    'true', 'true', 'shopify', 0, 'deny', 'manual',
  ]);
  const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
  const theme = {
    ...structuredClone(template),
    package_type: 'dawn_configuration_reference' as const,
    version: 1,
    store_name: merchant.storeName,
    rut: merchant.rut,
    merchant,
    legal_policies: legalPolicies,
    catalog: SHOPIFY_CATALOG.map(product => ({ ...product })),
    pending_fields: [!merchant.email && 'email', !merchant.address && 'address'].filter((field): field is string => Boolean(field)),
    instructions: [
      'Este JSON es un paquete de configuración de referencia para Dawn: no instala un tema. Shopify sube temas completos en ZIP.',
      'Agrega Dawn desde la tienda de temas y aplica los colores, formato CLP y anuncio desde su editor. No reemplaces settings_data.json con este archivo.',
      'Importa el CSV desde Productos > Importar. Revisa los 5 borradores: precios sugeridos, fotos, proveedor y existencias antes de publicar.',
      'Configura Chile, CLP e impuestos incluidos en Shopify. El CSV no establece la moneda ni la configuración tributaria de la tienda.',
      'Completa los datos pendientes y revisa los textos de legal_policies antes de copiarlos a Configuración > Políticas.',
      'Contrata y configura por separado pasarelas, couriers, captura de RUT y emisor de DTE. Mostrar insignias solo después de activar los servicios.',
    ],
    sources: SHOPIFY_SOURCES,
  };
  return { csv, theme };
}
