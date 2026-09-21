import { describe, expect, test } from 'vitest';
import { generateShopifyAssets } from '../../lib/shopify/instant-generator';

const merchant = { rut: '12345678-5', storeName: 'Tienda "Mascotas", Chile', email: 'tienda@example.com', address: 'Calle Prueba 123' };

describe('generador Shopify Chile', () => {
  test('genera CSV UTF-8 con 5 productos, precios CLP y comillas escapadas', () => {
    const { csv, theme } = generateShopifyAssets(merchant);
    const rows = csv.trim().split('\r\n');
    expect(rows).toHaveLength(6);
    expect(rows[0]).toContain('"URL handle","Title","Description","Vendor"');
    expect(csv).toContain('"Tienda ""Mascotas"", Chile"');
    expect(csv).toContain('"24990"');
    expect(csv).toContain('"false","draft"');
    expect(theme.catalog.filter(product => product.role === 'heroe')).toHaveLength(1);
    expect(theme.catalog.filter(product => product.role === 'complementario')).toHaveLength(3);
    expect(theme.catalog.filter(product => product.role === 'adicional')).toHaveLength(1);
    expect(new Set(theme.catalog.map(product => product.handle)).size).toBe(5);
  });

  test('inyecta identidad y políticas sin modificar la plantilla ni otro comercio', () => {
    const first = generateShopifyAssets(merchant).theme;
    const second = generateShopifyAssets({ rut: '12.345.678-5', storeName: 'Otra Tienda' }).theme;
    expect(first.rut).toBe('12.345.678-5');
    expect(first.store_name).toBe(merchant.storeName);
    expect(second.store_name).toBe('Otra Tienda');
    expect(first.money_format).toBe('$ {{amount_no_decimals}}');
    expect(first.announcement_bar.background_color).toBe('#0f172a');
    for (const policy of Object.values(first.legal_policies)) expect(policy).toContain(first.rut);
    expect(first.legal_policies.terms).toContain('21.713');
    expect(first.legal_policies.returns).toContain('10 días');
    expect(first.legal_policies.warranty).toContain('6 meses');
    expect(first.legal_policies.warranty).toContain('reparación');
    expect(first.package_type).toBe('dawn_configuration_reference');
    expect(first.instructions.join(' ')).toContain('no instala');
    expect(second.pending_fields).toEqual(['email', 'address']);
  });

  test('escapa HTML y neutraliza fórmulas en campos CSV', () => {
    const { theme, csv } = generateShopifyAssets({ ...merchant, storeName: '=HYPERLINK("x")<script>alert(1)</script>' });
    expect(csv).toContain('"\'=HYPERLINK');
    expect(theme.legal_policies.terms).not.toContain('<script>');
    expect(theme.legal_policies.terms).toContain('&lt;script&gt;');
  });

  test.each([null, {}, { rut: '12345678-9' }, { rut: '12..345678-5' }, { rut: ['12345678-5'] }, { rut: '12345678-5', storeName: '\n' }, { rut: '12345678-5', email: 'incorrecto' }])('rechaza entradas inválidas %#', input => {
    expect(() => generateShopifyAssets(input)).toThrow();
  });
});
