import { test, expect } from '@playwright/test';

for (const outcome of ['approve', 'reject'] as const) {
  test(`checkout completo con resultado ${outcome} y recuperación tras recarga`, async ({ page, request }) => {
    const config = await request.get('/api/checkout/config');
    expect((await config.json()).mode).toBe('mock');
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/checkout');
    const submit = page.getByRole('button', { name: 'Continuar a Webpay Plus simulado' });
    await expect(submit).toBeDisabled();
    await page.getByRole('button', { name: 'Agregar Cepillo de vapor para mascotas' }).click();
    await expect(page.getByTestId('checkout-total')).toHaveText('$28.790');
    await page.getByLabel('Nombre completo').fill('Cliente Prueba');
    await page.getByLabel('RUT / DNI').fill('12.345.678-9');
    await page.getByLabel('Email', { exact: true }).fill('qa@example.com');
    await page.getByLabel('Teléfono (+569)', { exact: true }).fill('+56912345678');
    await page.getByLabel('Dirección (calle, número y departamento)', { exact: true }).fill('Calle Prueba 123');
    await page.getByLabel('Comuna', { exact: true }).fill('Santiago');
    await page.getByLabel('Región', { exact: true }).fill('Metropolitana');
    await submit.click();
    await expect(page.getByRole('alert')).toContainText('RUT o DNI inválido');
    await page.getByLabel('RUT / DNI').fill('12.345.678-5');
    await submit.click();
    await expect(page.getByRole('heading', { name: 'Confirma tu pago de prueba' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Confirma tu pago de prueba' })).toBeVisible();
    await page.getByRole('button', { name: outcome === 'approve' ? 'Simular pago aprobado' : 'Simular rechazo', exact: true }).click();
    const result = outcome === 'approve' ? 'Pago simulado aprobado' : 'Pago simulado rechazado';
    await expect(page.getByRole('heading', { name: result })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: result })).toBeVisible();
    await expect(page.getByTestId('checkout-total')).toHaveText('$28.790');
    await expect(page.getByText('No se ha emitido ni enviado una boleta al SII.')).toHaveCount(outcome === 'approve' ? 1 : 0);
    await page.getByRole('button', { name: outcome === 'approve' ? 'Nueva compra de prueba' : 'Volver al checkout' }).click();
    if (outcome === 'approve') await expect(page.getByText('Tu carrito está vacío. Agrega un producto para continuar.')).toBeVisible();
    else await expect(page.getByTestId('checkout-total')).toHaveText('$28.790');
    expect(errors).toEqual([]);
  });
}

test('carrito limita cantidades, conserva cambios y aplica envío gratis', async ({ page }) => {
  await page.goto('/checkout');
  const add = page.getByRole('button', { name: 'Agregar Cepillo de vapor para mascotas' });
  for (let i = 0; i < 10; i++) await add.click();
  await expect(add).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Aumentar Cepillo de vapor para mascotas' })).toBeDisabled();
  await expect(page.getByTestId('checkout-total')).toHaveText('$249.900');
  await page.reload();
  await expect(page.getByLabel('Cantidad Cepillo de vapor para mascotas', { exact: true })).toHaveText('10');
  await page.getByRole('button', { name: 'Eliminar Cepillo de vapor para mascotas' }).click();
  await expect(page.getByTestId('checkout-total')).toHaveCount(0);
});
