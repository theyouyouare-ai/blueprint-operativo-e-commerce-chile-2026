import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('tab-shopify').click();
  await expect(page.getByRole('heading', { name: 'Generador Instantáneo de Tienda Shopify para Chile' })).toBeVisible();
});

test('valida RUT y descarga los cinco productos y el JSON personalizado desde Express', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const csvButton = page.getByRole('button', { name: 'Descargar Catálogo CSV (5 Ganadores)', exact: true });
  const themeButton = page.getByRole('button', { name: 'Descargar Tema Shopify Pro (.JSON)', exact: true });
  await expect(csvButton).toBeDisabled();
  await expect(themeButton).toBeDisabled();
  await page.getByLabel('RUT del comercio').fill('12.345.678-9');
  await expect(page.getByText('RUT inválido. Revisa el formato y el dígito verificador.')).toBeVisible();
  await expect(csvButton).toBeDisabled();
  await page.getByLabel('RUT del comercio').fill('12345678-5');
  await page.getByLabel('Nombre o razón social').fill('Mascotas "Chile", SpA');
  await page.getByLabel('Correo de atención').fill('tienda@example.com');
  await page.getByLabel('Domicilio del proveedor').fill('Calle Prueba 123');
  await expect(csvButton).toBeEnabled();

  const requestPromise = page.waitForRequest('**/api/shopify/download-catalog');
  const csvPromise = page.waitForEvent('download');
  await csvButton.click();
  const request = await requestPromise;
  expect(request.method()).toBe('POST');
  expect(request.url()).not.toContain('12345678');
  const csvDownload = await csvPromise;
  expect(csvDownload.suggestedFilename()).toBe('catalogo-shopify-chile.csv');
  expect(await csvDownload.failure()).toBeNull();
  const csv = await readFile((await csvDownload.path())!, 'utf8');
  expect(csv.trim().split('\r\n')).toHaveLength(6);
  expect(csv).toContain('"Mascotas ""Chile"", SpA"');
  expect(csv).toContain('"24990"');
  expect(csv.match(/"draft"/g)).toHaveLength(5);

  const themePromise = page.waitForEvent('download');
  await themeButton.click();
  const themeDownload = await themePromise;
  expect(themeDownload.suggestedFilename()).toBe('tema-shopify-pro-chile.json');
  expect(await themeDownload.failure()).toBeNull();
  const theme = JSON.parse(await readFile((await themeDownload.path())!, 'utf8'));
  expect(theme.rut).toBe('12.345.678-5');
  expect(theme.store_name).toBe('Mascotas "Chile", SpA');
  expect(theme.pending_fields).toEqual([]);
  expect(theme.catalog).toHaveLength(5);
  for (const policy of Object.values(theme.legal_policies)) expect(policy).toContain(theme.rut);
  expect(theme.legal_policies.terms).toContain('21.713');
  expect(theme.legal_policies.warranty).toContain('6 meses');
  expect(theme.announcement_bar.background_color).toBe('#0f172a');
  await expect(page.getByRole('button', { name: 'Siguiente Sección' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('informa un fallo de descarga y permite volver a intentarlo', async ({ page }) => {
  await page.getByLabel('RUT del comercio').fill('12.345.678-5');
  await page.route('**/api/shopify/download-theme', route => route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"Fallo controlado"}' }));
  const button = page.getByRole('button', { name: 'Descargar Tema Shopify Pro (.JSON)', exact: true });
  await button.click();
  await expect(page.getByRole('alert')).toContainText('No se pudo generar el archivo');
  await expect(button).toBeEnabled();
  await page.unroute('**/api/shopify/download-theme');
  const downloadPromise = page.waitForEvent('download');
  await button.click();
  expect(await (await downloadPromise).failure()).toBeNull();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
