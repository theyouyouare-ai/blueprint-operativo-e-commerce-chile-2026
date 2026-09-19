import { test, expect } from '@playwright/test';

test('a failed application chunk displays an error and reload recovers', async ({ page }) => {
  await page.route('**/assets/bootstrap-*.js', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('No pudimos cargar la aplicación');
  await page.unroute('**/assets/bootstrap-*.js');
  await page.getByRole('button', { name: 'Recargar página' }).click();
  await expect(page.getByRole('heading', { name: 'Blueprint Operativo E-commerce', exact: true })).toBeVisible();
});

test('direct checkout navigation and refresh load without uncaught errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/checkout');
  await expect(page.locator('#root button').first()).toBeVisible();
  await page.reload();
  await expect(page.locator('#root button').first()).toBeVisible();
  expect(errors).toEqual([]);
});
