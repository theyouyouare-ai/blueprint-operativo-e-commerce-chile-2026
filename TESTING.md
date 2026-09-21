# Suite de pruebas

Usar Node >=22.13 y pnpm 11.19.0. Preparar dependencias con `pnpm install --frozen-lockfile` antes de ejecutar las suites; no reinstalar `node_modules` mientras corren pruebas.

## Comandos y alcance

| Comando | Alcance |
| --- | --- |
| `pnpm test` o `pnpm test:unit` | Toda la suite Vitest: utilidades, servicios, integración HTTP y componentes |
| `pnpm test:unit tests/components` | Componentes React con Testing Library, user-event y jsdom |
| `pnpm typecheck` o `pnpm lint` | TypeScript; `lint` es un alias, no un linter de estilo |
| `pnpm check` | TypeScript, toda la suite Vitest y compilación Vite/esbuild |
| `pnpm test:e2e` | Playwright en Chromium, Firefox y WebKit contra el servidor de producción |

Antes del primer E2E, instalar navegadores con `pnpm exec playwright install chromium firefox webkit`. Ejecutar `pnpm check` y después `pnpm test:e2e`: Playwright arranca `pnpm start`, que necesita el build. Para garantizar que se prueba ese build, dejar libre el puerto 3000; en local la configuración permite reutilizar un servidor existente. El checkout E2E exige modo simulador, sin credenciales de Mercado Pago/Webpay. No usar este recorrido contra una tienda con pagos reales.

Playwright se fija en 1.61.0 por compatibilidad con macOS 14.8.9: la versión 1.63.0 falla al crear páginas con `Unknown setting: PushAPIEnabled` en el WebKit congelado 2251 que distribuye para este sistema. El [adaptador oficial 1.61.0](https://github.com/microsoft/playwright/blob/v1.61.0/packages/playwright-core/src/server/webkit/wkPage.ts) no envía ese ajuste. Antes de actualizar Playwright, verificar los tres motores en el sistema operativo del host. WebKit 2251 no representa la versión más reciente de Safari. jsdom se mantiene en la rama 26 para respetar el mínimo Node declarado.

## Auditoría de cobertura funcional

- `tests/unit/`: cálculos financieros, salud de dependencias, configuración, CORS, resiliencia del proveedor IA, frontera cliente/servidor y entrega de la SPA.
- `src/checkout/*.test.ts`: cálculos CLP, validaciones, firmas, idempotencia, concurrencia, persistencia y fallos de proveedores; integración Express sobre puertos efímeros. Se agregaron entradas nulas/anidadas inválidas y un fallo interno con respuesta JSON 500 sin datos privados, seguido de recuperación.
- `tests/components/checkout.test.tsx`: carrito vacío/corrupto, actualización de totales y eliminación, bloqueo ante caída de configuración, rechazo de sesión incompleta, conservación de sesiones válidas ante fallo de estado y cancelación de consultas al desmontar/salir de la página. Las llamadas HTTP se sustituyen por respuestas controladas y se restauran después de cada prueba.
- `tests/e2e/`: navegación y estado compartido, descargas PDF/JSON, arranque, recuperación de errores, contratos API y checkout. El nuevo recorrido cubre RUT inválido, aprobación/rechazo simulado, recarga de órdenes pendientes y cerradas, limpieza o conservación del carrito, límite de cantidad y despacho gratuito.

Esta auditoría identifica comportamientos cubiertos; no mide un porcentaje de líneas o ramas. jsdom verifica interacción y DOM, no el diseño visual de Tailwind. Playwright verifica visibilidad e interacción en el build real, sin comparación de capturas. La CI existente ejecuta Chromium; Firefox y WebKit también forman parte del comando E2E local completo.

## Ciclo TDD del 20 de septiembre de 2026

Línea base: `pnpm check` aprobó 92 pruebas en 12 archivos, TypeScript y build. La nueva prueba de sesión persistida incompleta falló: el checkout ocultaba el carrito y mostraba un pago no autorizado con datos incompletos. Se incorporó un esquema Zod compartido para validar la sesión antes de restaurarla. La prueba pasó después del cambio, sin relajar pruebas existentes.

La ejecución de los tres motores también reprodujo un fallo de recuperación: WebKit retenía una descarga `modulepreload` fallida incluso después de recargar, sin volver a solicitar el módulo. Corresponde al [defecto WebKit 270357](https://bugs.webkit.org/show_bug.cgi?id=270357). Se desactivó la precarga de módulos en Vite; los imports dinámicos y el CSS continúan cargándose. La prueba original de arranque pasó tras el cambio, sin modificar aserciones ni tiempos de espera. Se pierde la optimización de precarga de JavaScript para permitir la recuperación en ese motor.

También se incorporó cancelación de la consulta de configuración al desmontar/salir de la página, conservando el timeout y reanudando la consulta al restaurar la página desde la caché de navegación. La inicialización usa `useLayoutEffect` para preparar consulta y cancelación antes del primer pintado; hacerlo en un efecto pasivo dejaba una carrera con la recarga inmediata. Las llamadas de checkout declaran `mode: 'same-origin'`, acorde con sus rutas locales. La prueba original de recarga pasó diez repeticiones en WebKit tras el ajuste, sin modificar aserciones ni agregar reintentos automáticos.

Los pagos de estas suites son simulados o usan dobles de dependencias. No acreditan cobros reales, emisión de DTE ni disponibilidad de infraestructura externa.

## Validación final — 21 de septiembre de 2026

- `pnpm check`: TypeScript, 107 pruebas en 13 archivos y build aprobados.
- `pnpm test:e2e`: 48/48 aprobadas, sin omisiones ni reintentos; 16 por motor (Chromium, Firefox y WebKit).
- Regresión de recarga de checkout en WebKit: 10/10 repeticiones aprobadas antes de la ejecución completa.
- `git diff --check` y memoria JSON: correctos.
- Persisten advertencias no bloqueantes de Vite sobre anotaciones de Zod y tamaño del bundle.

## Generador Shopify — 21 de septiembre de 2026

Se agregaron 18 pruebas Vitest: diez para catálogo, escape CSV/HTML, RUT, inyección de identidad, políticas y aislamiento entre comercios; ocho de integración Express para adjuntos, MIME UTF-8, no-store, validación, límites de cuerpo y recuperación tras un error interno. La primera ejecución de las pruebas del generador falló por ausencia del módulo; pasó después de implementar el servicio.

Los dos recorridos nuevos de Playwright verifican la pestaña Shopify, bloqueo con RUT inválido, descargas CSV/JSON reales desde Express y recuperación tras una respuesta 500. Se leen los archivos descargados y se comprueban los cinco productos, precios, identidad, políticas y parámetros del tema en los tres motores.

- `pnpm check`: TypeScript, **125/125 pruebas en 15 archivos**, Vite y esbuild aprobados.
- `pnpm test:e2e`: **54/54 aprobadas**, sin omisiones ni reintentos; 18 por motor.
- Se mantienen las 107 pruebas Vitest y 48 E2E anteriores sin modificar sus archivos.
- La validación cubre el formato generado y el flujo local. No se realizó una importación en una cuenta Shopify ni una instalación de tema: el JSON es configuración de referencia para Dawn, no un ZIP instalable.
