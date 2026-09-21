# Reglas del proyecto

Proyecto: blueprint-operativo-e-commerce-chile-2026.
Estas reglas describen la arquitectura actual y el flujo preventivo de trabajo.
Actualizar este documento cuando cambien decisiones verificadas del proyecto.

## Antes de modificar código

1. Leer este archivo y `.codex/error_memory.json`; aplicar las reglas preventivas relevantes.
2. Revisar `git status --short` y el diff de los archivos afectados. Preservar cambios previos del usuario y evitar reformateos ajenos a la tarea.
3. Consultar `package.json`, la configuración y los módulos relacionados antes de asumir comandos, rutas o dependencias. Buscar con `rg`.
4. Identificar el comportamiento esperado, las restricciones y cómo se verificará el cambio.
5. Reutilizar servicios y validaciones existentes; preferir cambios pequeños que resuelvan la causa raíz.

## Arquitectura y patrones

- TypeScript con módulos ESM, Express 4 en `server.ts`, React 19 con Vite y Tailwind en el frontend.
- `server.ts` compone middleware, rutas y arranque. Mantener la lógica de pagos en `src/server/` y los contratos, esquemas Zod y cálculos puros en `src/checkout/model.ts`.
- `src/server/checkout-router.ts` adapta HTTP; los servicios implementan casos de uso. `payment-config.ts` valida configuración y `payment-runtime.ts` selecciona la implementación.
- Inyectar dependencias de red, persistencia y bloqueo en servicios para probar comportamiento sin servicios reales.
- Mantener Supabase administrativo (`server/supabase-admin.ts`), configuración privada (`server/env-validator.ts`) y Redis exclusivamente en servidor. Vite debe rechazar su importación por el cliente. Las migraciones versionadas pertenecen a `supabase/migrations/`.
- Componentes React funcionales y hooks; mantener el estado de interfaz separado de los hechos financieros verificados por el servidor.
- Validar datos de localStorage/sessionStorage antes de restaurarlos; conservar una orden válida si falla su consulta al servidor, sin habilitar automáticamente otra compra.
- La compilación genera `dist/client` (SPA) y `dist/server.js` (Express). No editar artefactos generados.

## Estándares de código

- Seguir el estilo del archivo: normalmente dos espacios, comillas simples y punto y coma. No introducir un formateador ni reescribir archivos completos para un cambio puntual.
- Usar nombres descriptivos, tipos explícitos en límites y `unknown` para entradas externas; validar con Zod antes de operar. Evitar nuevos `any` sin justificación.
- Reutilizar tipos compartidos para respuestas API. No duplicar fórmulas, esquemas o lógica de negocio en componentes.
- Usar `async/await`, timeouts en solicitudes externas y errores controlados. No convertir fallos de infraestructura en éxitos.
- Mensajes al usuario en español; comentarios breves que expliquen decisiones y restricciones.
- No importar módulos Node ni servicios administrativos en el bundle del navegador.

## Pagos e idempotencia

- El modo depende de `PAYMENT_ENV` y las credenciales. Sin token MP ni ambas claves Webpay, conservar el simulador visible. Con token MP, Mercado Pago tiene prioridad y exige sus dependencias completas.
- Una configuración real inválida o una caída del proveedor nunca debe activar un pago simulado.
- Calcular precios, despacho y totales en el servidor usando el catálogo y `splitGrossCLP` para el desglose tributario entero. Trabajar en pesos CLP enteros y conservar `neto + IVA = total`.
- Persistir la clave de idempotencia y huella de la compra antes de crear una transacción. Misma clave con distinto contenido debe rechazarse. Una creación incierta requiere conciliación, no recreación automática.
- No aceptar como evidencia de pago un retorno del navegador, un estado enviado por el cliente, CORS o una IP.
- Webpay confirma mediante SDK `commit/status`, verificando monto y referencias. Su almacén actual exige disco persistente y una única instancia/proceso; no trasladarlo a funciones efímeras sin rediseñarlo.
- Mercado Pago verifica HMAC SHA256 del manifiesto con `data.id` de la URL, `x-request-id` y `ts` de `x-signature`, usando comparación segura. Consultar la API del proveedor y comprobar ID, entorno, moneda, importe y referencia antes de actualizar.
- Mantener `lock:webhook:mp:{payment_id}` en Redis con `SET NX EX 60` y liberación Lua condicionada al propietario. Los fallos o la contención deben permitir reintento.
- La transición de pago en Supabase debe filtrar atómicamente `status = pending`; una comprobación previa en JavaScript no basta. Preservar restricciones únicas y auditoría transaccional.
- Mantener capacidades privadas para consultar órdenes y no devolver datos personales en respuestas públicas.

## Configuración, seguridad y despliegue

- Usar Node y pnpm según `engines` y `packageManager` de `package.json`. Mantener `pnpm-lock.yaml` sincronizado; no mezclar gestores de paquetes durante una tarea.
- No ejecutar suites en paralelo con comandos que puedan reinstalar o recrear `node_modules`; completar primero la preparación de dependencias.
- Ante `ERR_PNPM_UNEXPECTED_STORE`, inspeccionar el store de la instalación existente y usarlo para esa operación. No cambiar configuración global ni fijar rutas locales de otra máquina en el proyecto.
- Documentar variables nuevas en `.env.example` sin secretos. No versionar `.env`, tokens, claves, capacidades, datos personales ni registros de pagos reales.
- `process.env` corresponde al servidor y herramientas Node; en navegador, solo opciones públicas mediante `import.meta.env.VITE_*`. Nunca prefijar secretos con `VITE_`.
- Mantener HTTPS en producción, orígenes CORS explícitos y confianza de proxy acotada. Consultar `DEPLOYMENT.md` antes de cambiar el hosting.
- Servir únicamente `dist/client` como contenido público; una ruta `/assets` inexistente devuelve 404, nunca el HTML de la SPA. Mantener rutas API fuera del fallback SPA.
- Un desglose `ready_for_issuance` no equivale a DTE emitido. No afirmar cumplimiento SII completo ni reportes tributarios que el código no realiza; verificar fuentes oficiales al cambiar reglas legales.

## Verificación y cierre

- Para código TypeScript: `pnpm typecheck` y pruebas pertinentes con Vitest. Para pagos, cubrir firma inválida, repetición/concurrencia, montos y entornos incorrectos, persistencia y caídas de dependencias.
- Antes de entregar cambios de código o configuración de build, ejecutar `pnpm check` (TypeScript, suite unitaria/integración y build). Si algo impide ejecutarlo, informar la limitación sin declarar éxito.
- Para cambios de navegación o interfaz, ejecutar las pruebas Playwright relevantes tras compilar cuando el entorno disponga del navegador. Pruebas con dobles de proveedores no acreditan pagos reales.
- Verificar recuperación de módulos fallidos en los tres motores. Al actualizar Playwright, comprobar compatibilidad con los binarios disponibles para el SO del host; no omitir pruebas para ocultar un fallo de protocolo.
- Para documentación o memoria exclusivamente, basta verificar archivos, enlaces locales y JSON; no ejecutar la suite completa sin motivo.
- Revisar `git diff --check`, el alcance del diff y resultados reales. No eliminar pruebas ni relajar aserciones solo para obtener pases.
- Informar qué cambió, qué se verificó y qué depende de credenciales o infraestructura externa. No reutilizar recuentos históricos como resultados de la tarea actual.

## Mantenimiento de la memoria

- El registro inicial `ERR-001` con síntoma `Ejemplo de error` es una plantilla, no un incidente real ni una regla activa.
- Al diagnosticar y corregir un error real, reemplazar esa plantilla por el primer incidente; después agregar IDs únicos consecutivos (`ERR-002`, etc.). Mantener los cinco campos de texto de la plantilla.
- Registrar síntoma reproducible, causa raíz comprobada, solución aplicada con su verificación y una regla preventiva concreta. Si una causa no está confirmada, indicarlo; no inventarla.
- Antes de agregar un registro, buscar duplicados por síntoma y causa; actualizar el existente si corresponde, preservando información útil.
- No almacenar secretos ni datos personales. Validar el JSON tras cada modificación y promover reglas generales comprobadas a este archivo.
- La memoria se mantiene mediante este flujo de trabajo; no es un recolector automático de excepciones de la aplicación.

## Readiness y contratos HTTP

- `/health` y `/api/health` solo devuelven 200 tras consultar Supabase y hacer PING a Redis; ausencias/fallos devuelven 503. `/live` es únicamente liveness.
- Mantener `/api/checkout/create-order` compatible con `/api/checkout/process`. El webhook Mercado Pago en modo mock usa el protocolo HMAC simulado documentado, nunca sobre órdenes reales.
