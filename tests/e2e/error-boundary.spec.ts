import { test, expect } from '@playwright/test';

for (const route of ['/', '/checkout']) {
  test(`muestra un error recuperable si falla el proveedor en ${route}`, async ({ page }) => {
    await page.addInitScript(() => {
      // Simula datos persistidos incompatibles que hacen fallar AppProvider.
      if (!sessionStorage.getItem('boundary-error-injected')) {
        localStorage.setItem('dropship_sprint_tasks_2026', 'null');
        sessionStorage.setItem('boundary-error-injected', 'true');
      }
    });
    await page.goto(route);
    await expect(page.getByRole('alert')).toContainText('No pudimos cargar esta pantalla');
    await page.evaluate(() => localStorage.removeItem('dropship_sprint_tasks_2026'));
    await page.getByRole('button', { name: 'Recargar página' }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.locator('#root')).not.toBeEmpty();
    await expect(page).toHaveURL(new RegExp(`${route === '/' ? '/' : '/checkout'}$`));
  });
}
