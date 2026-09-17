import { test, expect } from '@playwright/test';

test.describe('E2E Workflow: Blueprint Operativo E-commerce Chile 2026', () => {
  test.beforeEach(async ({ page }) => {
    // Interceptar errores no controlados en la consola del navegador
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Guardar referencia en el contexto de la prueba
    (page as any).__consoleErrors = consoleErrors;

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Blueprint Operativo E-commerce', exact: true })).toBeVisible();
  });

  test('Recorrido completo de navegación de Tab 1 a Tab 6 conservando AppContext', async ({ page }) => {
    // 1. Tab 1: Auditoría 2026
    const tab1Btn = page.locator('#btn-tab-auditoria, [data-testid="tab-auditoria"]');
    await expect(tab1Btn).toBeVisible();
    await tab1Btn.click();
    await expect(page.locator('text=Auditoría del Plan Original').first()).toBeVisible();

    // 2. Tab 2: Simulador Financiero
    const tab2Btn = page.locator('#btn-tab-calculadora, [data-testid="tab-calculadora"]');
    await expect(tab2Btn).toBeVisible();
    await tab2Btn.click();
    await expect(page.locator('text=Simulador Financiero & Costo Landed').first()).toBeVisible();

    // 3. Tab 3: Nichos & Validación
    const tab3Btn = page.locator('#btn-tab-nichos, [data-testid="tab-nichos"]');
    await expect(tab3Btn).toBeVisible();
    await tab3Btn.click();
    await expect(page.locator('text=Nichos de Alta Rentabilidad').first()).toBeVisible();

    // 4. Tab 4: Compliance & Operativa SII
    const tab4Btn = page.locator('#btn-tab-compliance, [data-testid="tab-compliance"]');
    await expect(tab4Btn).toBeVisible();
    await tab4Btn.click();
    await expect(page.locator('text=Tab 4: Compliance, Legal & Operativa SII').first()).toBeVisible();

    // 5. Tab 5: Logística, Fulfillment & APIs
    const tab5Btn = page.locator('#btn-tab-logistica, [data-testid="tab-logistica"]');
    await expect(tab5Btn).toBeVisible();
    await tab5Btn.click();
    await expect(page.locator('text=Arquitectura Logística & Fulfillment E-commerce').first()).toBeVisible();

    // 6. Tab 6: Dashboard Consolidado
    const tab6Btn = page.locator('#btn-tab-dashboard_ejecutivo, [data-testid="tab-dashboard_ejecutivo"]');
    await expect(tab6Btn).toBeVisible();
    await tab6Btn.click();
    await expect(page.locator('text=Dashboard de Lanzamiento').first()).toBeVisible();

    // Comprobar que los 4 KPI Cards principales están renderizados
    await expect(page.locator('[data-testid="kpi-card-landed"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-card-margin"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-card-compliance"]')).toBeVisible();
  });

  test('Reactividad Tab 3 -> Tab 6: formulario actualiza reactivamente los KPI Cards del Dashboard', async ({ page }) => {
    // Ir a Tab 6 para leer el valor inicial del Costo Landed
    const tab6Btn = page.locator('#btn-tab-dashboard_ejecutivo, [data-testid="tab-dashboard_ejecutivo"]');
    await tab6Btn.click();
    const initialLandedText = await page.locator('[data-testid="kpi-landed-value"]').innerText();

    // Navegar a Tab 3: Nichos & Unit Economics
    const tab3Btn = page.locator('#btn-tab-nichos, [data-testid="tab-nichos"]');
    await tab3Btn.click();

    // Localizar inputs de FOB y Flete en Tab 3
    const fobInput = page.locator('#input-fob-usd, [data-testid="input-fob-usd"]');
    await expect(fobInput).toBeVisible();

    // Ingresar un valor significativamente mayor en el FOB (ej: 85 USD)
    await fobInput.fill('');
    await fobInput.fill('85');

    // Regresar a Tab 6: Dashboard Consolidado
    await tab6Btn.click();

    // Validar que el KPI Card de Costo Landed se haya actualizado reactivamente en el Dashboard
    const updatedLandedText = await page.locator('[data-testid="kpi-landed-value"]').innerText();
    expect(updatedLandedText).not.toBe(initialLandedText);

    // Verificar que conserva el estado global tras navegar a otra pestaña y volver
    const tab1Btn = page.locator('#btn-tab-auditoria, [data-testid="tab-auditoria"]');
    await tab1Btn.click();
    await tab6Btn.click();

    const persistentLandedText = await page.locator('[data-testid="kpi-landed-value"]').innerText();
    expect(persistentLandedText).toBe(updatedLandedText);
  });

  test('Exportación PDF y JSON sin excepciones en consola', async ({ page }) => {
    // Ir a Tab 6
    const tab6Btn = page.locator('#btn-tab-dashboard_ejecutivo, [data-testid="tab-dashboard_ejecutivo"]');
    await tab6Btn.click();

    const jsonExportBtn = page.locator('#btn-export-json, [data-testid="btn-export-json"]');
    await expect(jsonExportBtn).toBeVisible();

    // Ejecutar exportación JSON
    const jsonDownloadPromise = page.waitForEvent('download');
    await jsonExportBtn.click();
    const jsonDownload = await jsonDownloadPromise;
    expect(jsonDownload.suggestedFilename()).toMatch(/\.json$/);
    expect(await jsonDownload.failure()).toBeNull();

    // Verificar notificación de éxito o estabilidad del DOM
    const successNotif = page.locator('[data-testid="export-success-notification"]');
    await expect(successNotif).toBeVisible({ timeout: 5000 });

    // Ejecutar exportación PDF
    const pdfExportBtn = page.locator('#btn-export-pdf, [data-testid="btn-export-pdf"]');
    await expect(pdfExportBtn).toBeVisible();
    const pdfDownloadPromise = page.waitForEvent('download');
    await pdfExportBtn.click();
    const pdfDownload = await pdfDownloadPromise;
    expect(pdfDownload.suggestedFilename()).toMatch(/\.pdf$/);
    expect(await pdfDownload.failure()).toBeNull();

    // Verificar que no se hayan registrado errores fatales en consola
    const errors = (page as any).__consoleErrors || [];
    const fatalErrors = errors.filter((err: string) => 
      !err.includes('favicon') && !err.includes('font') && !err.includes('websocket')
    );
    expect(fatalErrors.length).toBe(0);
  });
});
