# Pagos reales y despliegue

## Selección de entorno

- Sin token Mercado Pago ni ambas credenciales Webpay: modo `mock`, visible en `/checkout`, `/api/checkout/config` y `/api/checkout/config`.
- Con ambas y `PAYMENT_ENV=sandbox`: SDK oficial contra integración de Transbank.
- Con ambas y `PAYMENT_ENV=production`: cobros reales; exige origen HTTPS y almacenamiento persistente absoluto.
- Credenciales incorrectas o fallos de red no activan pagos simulados.
- Mercado Pago tiene prioridad cuando existe `MERCADOPAGO_ACCESS_TOKEN`; requiere además firma webhook, Supabase y Redis, también en sandbox.

El servidor carga `.env.local` y `.env` sin sobrescribir variables del host. Completar `.env.example` en el gestor de secretos; no subir claves al repositorio ni usar prefijos `VITE_`.

## Desplegar

1. Conectar este repositorio a un Blueprint de Render usando `render.yaml`.
2. Mantener `PAYMENT_ENV=sandbox` durante pruebas. Configurar `WEBPAY_COMMERCE_CODE`, `WEBPAY_API_KEY` y, opcionalmente, `GEMINI_API_KEY` en Render. Sin credenciales de ninguna pasarela, funciona el simulador.
3. Render compila Vite en `dist/client` y Express en `dist/server.js`; sirve ambos desde el mismo dominio. Configurar `/health` como health check cuando Supabase y Redis estén activos; el Blueprint básico no declara estas dependencias.
4. El origen usa `RENDER_EXTERNAL_URL` automáticamente. Para un dominio personalizado, configurar `APP_URL=https://dominio` (sin ruta).
5. Probar creación, aprobación, rechazo, cancelación y retorno en sandbox. Antes de operar, sustituir credenciales por las de tu comercio habilitado y cambiar `PAYMENT_ENV=production`.

El Blueprint básico declara únicamente el servicio Node `tienda-gonzalo-cl-2026-app`. Para Webpay real, configurar por separado un disco persistente y `PAYMENT_STORE_DIR`. La implementación de almacenamiento admite **un único proceso y una única instancia**; no usar clustering ni múltiples réplicas sobre este almacén. Para escalar, migrar a una base transaccional con bloqueo distribuido. Respaldar el disco y gestionar la retención de datos personales; las órdenes reales no se eliminan automáticamente. Límite actual: 10.000 órdenes por almacén.

## Flujo de pago

`POST /api/checkout/process` calcula importes en el servidor, guarda la orden y crea la transacción mediante `transbank-sdk`. Devuelve URL/token del banco y una capacidad privada para consultar esa orden. El navegador guarda la sesión y envía `token_ws` por formulario POST al dominio oficial Webpay.

El retorno se configura automáticamente como `APP_URL/api/webhooks/payment`; acepta GET o POST URL-encoded. El backend confirma con `commit` y exige `AUTHORIZED`, `response_code=0`, monto, buy_order y session_id coincidentes. Si `commit` falla, consulta `status`; nunca confía en un estado enviado por el navegador. Los retornos repetidos son idempotentes. `TBK_TOKEN` consulta estado sin confirmar una transacción cancelada. Un estado ambiguo sigue pendiente; se puede consultar desde el checkout.

Las órdenes y claves de idempotencia se escriben atómicamente antes de redirigir al banco. La recuperación tras reinicio no vuelve a crear ni confirmar un pago ya registrado. Una creación de resultado incierto requiere revisión; no se reintenta automáticamente. El DTE 39 sigue siendo un desglose preparado para emisión posterior: este código no emite boletas al SII.

## CORS y HTTPS

Por defecto se permite el origen de la aplicación. `CORS_ALLOWED_ORIGINS` agrega orígenes exactos separados por comas. No se usa `*` ni cookies para autenticar pagos. La navegación de retorno desde Transbank puede llegar desde otro origen; se admite ese retorno y se verifica su token con el SDK. El HMAC `PAYMENT_WEBHOOK_SECRET` se utiliza **solo en el simulador**, no como supuesto mecanismo oficial de Webpay.

Render termina TLS y el servidor confía en un salto de proxy únicamente cuando `RENDER=true`. Las rutas API de pagos reales rechazan HTTP. No publicar el directorio `.data` ni montar el disco dentro de `dist/client`.

## Verificación

### Carga de producción

- Este repositorio usa un **Web Service Node**, con `NODE_ENV=production node dist/server.js` como comando de inicio. El directorio público es `dist/client`, no `dist`; no configurar un Static Site para este servicio con API.
- Express resuelve `client` relativo a `dist/server.js`, valida el HTML y sus activos al arrancar y sirve `index.html` sin caché para las rutas SPA (`/checkout` incluido). No se necesitan reglas de rewrite de Static Sites en Render.
- Los archivos con hash de `/assets` usan caché inmutable. Un activo ausente devuelve 404, nunca HTML. Las rutas API conservan sus respuestas JSON.
- La consola del navegador muestra mensajes `[Startup]`. Los fallos al importar el bundle muestran un aviso y permiten recargar; los fallos de render se capturan con ErrorBoundary. El HTML inicial también muestra un mensaje si el JavaScript de entrada no llega a cargarse.
- `npm test` ejecuta las pruebas unitarias e integración. Después de `npm run build`, ejecutar `pnpm test:e2e --project=chromium` para verificar carga, recuperación, API y navegación.
- Las variables privadas se leen en Node. El navegador no requiere variables de entorno; cualquier futura opción pública debe leerse con `import.meta.env.VITE_*` y un valor de respaldo, nunca incluir claves privadas.

Las 35 pruebas originales se conservan. Se agregan pruebas de configuración, persistencia, idempotencia, validación del resultado bancario y CORS con un adaptador de prueba. El build de Render usa directamente pnpm para instalar con lockfile, validar tipos y compilar, sin activar ejecutables globales mediante Corepack. Las pruebas se ejecutan por separado en local y CI.

Se comprobó además la creación y consulta de una transacción en el sandbox oficial con sus credenciales públicas de integración: estado `INITIALIZED`, sin autorización ni cobro. Esto no acredita el acceso del comercio a producción ni sustituye una prueba de pago/retorno completa.

Referencias: [SDK y flujo Webpay Plus](https://transbankdevelopers.com/documentacion/webpay-plus), [configuración SDK](https://transbankdevelopers.com/documentacion/como_empezar), [Blueprint de Render](https://render.com/docs/blueprint-spec).


## Mercado Pago y Supabase

1. Ejecutar `supabase/migrations/202609190001_payment_orders.sql` en Supabase.
2. Configurar `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `REDIS_URL`,
   `MERCADOPAGO_ACCESS_TOKEN` y `MERCADOPAGO_WEBHOOK_SECRET`. Separar proyectos,
   aplicaciones MP y secretos entre sandbox y producción. Usar APP_URL público HTTPS.
3. Registrar eventos de pagos en `APP_URL/api/webhooks/mercadopago` en Mercado Pago.
   Se valida HMAC SHA256 del manifiesto oficial con `data.id` de la URL,
   `x-request-id` y `ts` de `x-signature`; no se confía en el cuerpo de la notificación.
4. Checkout Pro crea una preferencia con `external_reference` igual al UUID de la
   orden y monto CLP calculado por el servidor. El navegador abre `sandbox_init_point`
   o `init_point` según PAYMENT_ENV. El retorno del navegador nunca confirma un pago.
5. El webhook toma `lock:webhook:mp:{payment_id}` con `SET NX EX 60`, consulta
   `/v1/payments/{id}` y verifica ID, entorno, moneda, importe y referencia.
   Actualiza Supabase con filtro atómico `status=eq.pending` solamente si está aprobado.
   La auditoría se guarda en la misma transacción mediante trigger SQL. Un intento
   rechazado deja la orden pendiente para permitir un nuevo intento en la preferencia.
6. Lock ocupado, Redis caído o Supabase caído producen error para permitir reintentos;
   no hay fallback en memoria ni éxito simulado. La liberación Lua comprueba el dueño.
   Las notificaciones auténticas demoradas se aceptan: consultar al proveedor y el
   filtro de estado hacen inocua su repetición. Cada llamada HTTP tiene timeout de
   hasta 10 segundos; las tres llamadas del webhook caben dentro del lease de 60s.

La restricción única de clave de idempotencia impide crear preferencias duplicadas
entre instancias. Una caída entre crear la preferencia y guardar su URL deja la orden
pendiente de conciliación manual; no se recrea automáticamente. No cambiar de cuenta
Mercado Pago sobre órdenes existentes. Reembolsos, contracargos y emisión DTE requieren
su propio flujo operativo; este endpoint solo confirma órdenes pendientes.

## Contenedor y límites de hosting

`Dockerfile` compila, verifica y ejecuta Express + SPA como usuario no root.
Montar volumen persistente en `/var/data/payments` con permisos del usuario node y
proveer variables mediante el gestor de secretos. El contenedor debe recibir HTTPS
para pagos production; en Render TLS termina en su proxy y `RENDER=true` habilita
la confianza en un salto. Para otros proxies, configurar `TRUST_PROXY` con las IP/CIDR exactas del proxy
y restringir el acceso directo al contenedor desde Internet.

`render.yaml` declara el servicio Node con build directo y `pnpm start`; no aprovisiona disco ni Redis. Configurar esas dependencias por separado para pagos reales. En un servicio administrado manualmente, guardar también los comandos en el panel: publicar este archivo no sobrescribe por sí solo los ajustes existentes.
El entorno inicial es sandbox: cambiar a production solo tras validar el flujo completo.
Se elige contenedor/Render; no se incluye `vercel.json` porque Webpay conserva un
almacén local persistente que no es compatible con funciones efímeras de Vercel.
No se ha desplegado ni aprovisionado infraestructura desde esta tarea.

## Trazabilidad tributaria

Vincular UUID de orden, ID de pago, fechas, bruto/neto/IVA y documento tributario en
la conciliación del comercio. `payment_audit` conserva las transiciones verificadas;
la aplicación prepara importes DTE 39 pero **no emite boletas ni reporta al SII**.
Configurar el emisor tributario y sus respaldos antes de operar. Las exigencias de
inicio de actividades y de información dependen del rol (comercio, intermediario u
operador de pago); guardar una orden no acredita cumplimiento integral de la ley.

Fuentes oficiales: [firma Mercado Pago](https://www.mercadopago.cl/developers/en/docs/subscriptions/additional-content/your-integrations/notifications/webhooks),
[inicio de actividades y obligaciones por rol, SII](https://www.sii.cl/destacados/ley_cumplimiento_obligaciones_tributarias/quienes_deben_inicio.html).


## Contratos verificados para Go-Live

- `GET /health` y `/api/health`: readiness con consulta autenticada a
  `payment_orders` en Supabase y `PING` a Redis en paralelo. Devuelven 200 solo si
  ambos responden; credenciales ausentes, migración faltante o caída devuelven 503.
  `GET /live` solo indica que Express está vivo. Docker usa `/health`; configurarlo en Render después de
  provisionar las dependencias y aplicar la migración antes del despliegue.
- `POST /api/checkout/create-order` es alias de `/api/checkout/process`: mismo
  contrato JSON, esquema de cliente, validación RUT e Idempotency-Key.
- Sin credenciales de pasarela se activa `mode=mock` (simulador local, distinto del
  sandbox remoto). En `/api/webhooks/mercadopago`, ese modo acepta el mismo JSON y
  HMAC de `/api/webhooks/payment`: `x-payment-timestamp` en milisegundos y
  `x-payment-signature = HMAC_SHA256(PAYMENT_WEBHOOK_SECRET, timestamp + '.' + rawBody)`.
  La firma caduca a los cinco minutos. Para pruebas locales sin gestionar firmas,
  usar `/api/checkout/mock-confirm` con orderId, paymentToken y outcome.
- Con credenciales Mercado Pago se exige siempre la firma oficial `x-signature`;
  nunca se acepta el protocolo simulado sobre órdenes reales. Los fallos de red o
  credenciales configuradas no habilitan el mock. Mantener visible el modo activo.
- La validación Módulo 11 verifica formato/checksum del RUT, no identidad ni inicio
  de actividades ante el SII. El IVA se desglosa con razón entera 100/119 y BigInt,
  con redondeo al peso y conservación neto + IVA = bruto. Eventos rechazan fracciones CLP.
- `server/supabase-admin.ts` y `server/env-validator.ts` son privados. Vite bloquea
  imports cliente de módulos `server/`, `src/server/` y validadores administrativos.

La instalación reproducible usa `pnpm install --frozen-lockfile`, equivalente al
paso de instalación solicitado pero respetando el gestor y lockfile del proyecto.
`pnpm build` / `npm run build` generan la SPA y Express; el inicio es
`NODE_ENV=production node dist/server.js`. No usar `vite preview` como servidor final.

Antes del Go-Live real, exigir /health=200 en el dominio HTTPS, PAYMENT_ENV=production,
credenciales del comercio, migración aplicada, callback registrado y una transacción
completa conciliada. Tests con dobles de red no acreditan estos requisitos externos.
La conexión GitHub→Render, rama main y despliegue automático deben estar configurados
en el panel; un push por sí solo no acredita que producción se haya actualizado.

Fuente del IVA general 19%: https://www.sii.cl/aprenda_sobre_impuestos/impuestos/impuestos_indirectos.htm
