# Webpay y Render

## Selección de entorno

- Sin ambas credenciales Webpay: modo `mock`, visible en `/checkout`, `/api/checkout/config` y `/api/health`.
- Con ambas y `PAYMENT_ENV=sandbox`: SDK oficial contra integración de Transbank.
- Con ambas y `PAYMENT_ENV=production`: cobros reales; exige origen HTTPS y almacenamiento persistente absoluto.
- Credenciales incorrectas o fallos de red no activan pagos simulados.
- Implementación elegida: Webpay Plus. Mercado Pago no está integrado.

El servidor carga `.env.local` y `.env` sin sobrescribir variables del host. Completar `.env.example` en el gestor de secretos; no subir claves al repositorio ni usar prefijos `VITE_`.

## Desplegar

1. Conectar este repositorio a un Blueprint de Render usando `render.yaml`.
2. Mantener `PAYMENT_ENV=sandbox` durante pruebas. Configurar `WEBPAY_COMMERCE_CODE`, `WEBPAY_API_KEY` y, opcionalmente, `GEMINI_API_KEY` en Render. Sin credenciales Webpay, funciona el simulador.
3. Render compila Vite en `dist/client` y Express en `dist/server.js`; sirve ambos desde el mismo dominio. Health check: `/api/health`.
4. El origen usa `RENDER_EXTERNAL_URL` automáticamente. Para un dominio personalizado, configurar `APP_URL=https://dominio` (sin ruta).
5. Probar creación, aprobación, rechazo, cancelación y retorno en sandbox. Antes de operar, sustituir credenciales por las de tu comercio habilitado y cambiar `PAYMENT_ENV=production`.

El Blueprint declara un servicio de pago y un disco persistente de 1 GB, sin desplegarlo automáticamente desde esta tarea. La implementación de almacenamiento admite **un único proceso y una única instancia**; no usar clustering ni múltiples réplicas sobre este almacén. Para escalar, migrar a una base transaccional con bloqueo distribuido. Respaldar el disco y gestionar la retención de datos personales; las órdenes reales no se eliminan automáticamente. Límite actual: 10.000 órdenes por almacén.

## Flujo de pago

`POST /api/checkout/process` calcula importes en el servidor, guarda la orden y crea la transacción mediante `transbank-sdk`. Devuelve URL/token del banco y una capacidad privada para consultar esa orden. El navegador guarda la sesión y envía `token_ws` por formulario POST al dominio oficial Webpay.

El retorno se configura automáticamente como `APP_URL/api/webhooks/payment`; acepta GET o POST URL-encoded. El backend confirma con `commit` y exige `AUTHORIZED`, `response_code=0`, monto, buy_order y session_id coincidentes. Si `commit` falla, consulta `status`; nunca confía en un estado enviado por el navegador. Los retornos repetidos son idempotentes. `TBK_TOKEN` consulta estado sin confirmar una transacción cancelada. Un estado ambiguo sigue pendiente; se puede consultar desde el checkout.

Las órdenes y claves de idempotencia se escriben atómicamente antes de redirigir al banco. La recuperación tras reinicio no vuelve a crear ni confirmar un pago ya registrado. Una creación de resultado incierto requiere revisión; no se reintenta automáticamente. El DTE 39 sigue siendo un desglose preparado para emisión posterior: este código no emite boletas al SII.

## CORS y HTTPS

Por defecto se permite el origen de la aplicación. `CORS_ALLOWED_ORIGINS` agrega orígenes exactos separados por comas. No se usa `*` ni cookies para autenticar pagos. La navegación de retorno desde Transbank puede llegar desde otro origen; se admite ese retorno y se verifica su token con el SDK. El HMAC `PAYMENT_WEBHOOK_SECRET` se utiliza **solo en el simulador**, no como supuesto mecanismo oficial de Webpay.

Render termina TLS y el servidor confía en un salto de proxy únicamente cuando `RENDER=true`. Las rutas API de pagos reales rechazan HTTP. No publicar el directorio `.data` ni montar el disco dentro de `dist/client`.

## Verificación

Las 35 pruebas originales se conservan. Se agregan pruebas de configuración, persistencia, idempotencia, validación del resultado bancario y CORS con un adaptador de prueba. El build de Render limpia las credenciales Webpay durante las pruebas para evitar llamadas reales.

Se comprobó además la creación y consulta de una transacción en el sandbox oficial con sus credenciales públicas de integración: estado `INITIALIZED`, sin autorización ni cobro. Esto no acredita el acceso del comercio a producción ni sustituye una prueba de pago/retorno completa.

Referencias: [SDK y flujo Webpay Plus](https://transbankdevelopers.com/documentacion/webpay-plus), [configuración SDK](https://transbankdevelopers.com/documentacion/como_empezar), [Blueprint de Render](https://render.com/docs/blueprint-spec).
