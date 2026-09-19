# Auditoría de producción — 19 de septiembre de 2026

**Resultado: validación local aprobada; Go-Live real pendiente de infraestructura y credenciales.**
No se ejecutaron commits, pushes, despliegues ni cobros.

## Brechas corregidas

| Hallazgo | Corrección |
| --- | --- |
| Faltaba `/health`; el diagnóstico anterior no comprobaba Redis y respondía 200 incluso sin conectividad | `/health` y `/api/health` consultan `payment_orders` con autenticación en Supabase y hacen `PING` a Redis. 200 únicamente con ambos sanos; 503 ante ausencia o fallo. Timeouts y cierre del cliente Redis. `/live` separado para liveness. |
| No existía `/api/checkout/create-order` | Alias del proceso existente, con validación Zod, RUT e idempotencia compartidas. |
| Webhook MP inoperante en modo simulador | HMAC del simulador únicamente cuando `runtime.mock` está activo. Con Mercado Pago configurado se conserva la firma oficial y consulta al proveedor; nunca fallback por caída de un servicio real. |
| Eventos aceptaban fracciones CLP y duplicaban una fórmula con tasa flotante | `splitGrossCLP` común: BigInt, razón 100/119, redondeo al peso. Eventos exigen enteros. Checkout conserva neto + IVA = bruto. |
| Módulos administrativos sin barrera ejecutable de imports cliente | Traslado de Supabase admin y validador a `server/`; Vite rechaza módulos privados en el grafo cliente, con pruebas negativas de build. No se constató filtración de credenciales. |
| Cabeceras de seguridad se instalaban después del router de checkout | Middleware movido antes de las rutas, incluyendo webhooks y errores de parsing. |
| Documentación de entorno/health desactualizada | `.env.example`, README, Docker, Render y guía de despliegue actualizados; memoria de errores y reglas preventivas mantenidas. |

## Comprobaciones

- RUT: Módulo 11 activo en el esquema utilizado por el checkout y el alias HTTP; RUT con dígito incorrecto devuelve 400. Esto no verifica identidad ni inicio de actividades en SII. DNI sigue siendo una opción explícita para extranjeros.
- CORS: orígenes exactos configurados, sin wildcard. Preflight permite cabeceras de checkout. Un origen parecido pero ajeno se rechaza. Webhooks pueden llegar sin Origin o desde el proveedor; su autenticación depende de la firma, no de CORS.
- Pagos reales mantienen HTTPS, validación del proveedor e idempotencia. Mercado Pago mantiene Redis `SET NX EX 60`, liberación por propietario y actualización atómica únicamente de órdenes pendientes.
- Inspección del código y siete archivos compilados del cliente: cero referencias a los nombres de claves privadas examinados y cero coincidencias de los formatos de credenciales literales examinados. La inspección por patrones no equivale a una certificación universal de ausencia de secretos.
- Vite publica `dist/client`; Express inicia desde `dist/server.js`. El servidor privado y los archivos de entorno no pueden descargarse por las rutas probadas.
- Render/Docker conservan instalación reproducible con pnpm y su lockfile. `npm run build` es compatible; no se sustituyó por `npm install` creando otro lockfile.

## Verificación ejecutada

| Comando | Resultado final |
| --- | --- |
| `npm run test` | **92/92 PASS**, 12 archivos de unitarias/integración |
| `npm run typecheck` (`tsc --noEmit`) | PASS, sin errores de tipos |
| `npm run build` | PASS, SPA y servidor generados |
| `pnpm check` | PASS antes de la reinstalación local de dependencias |
| `CI=1 pnpm test:e2e --project=chromium` | **13/13 PASS**, servidor compilado en modo producción |
| `git diff --check` y validación JSON de memoria | PASS |

El build avisa de un chunk de aproximadamente 1,18 MB y anotaciones PURE de Zod;
son advertencias no bloqueantes, no errores TypeScript. No se ocultaron advertencias.
Solo se ejecutó Chromium, no Firefox/WebKit.

Una ejecución intermedia de unitarias se interrumpió porque pnpm recreó
`node_modules` durante otra validación. Se completó la instalación y se repitieron
las comprobaciones secuencialmente. El incidente quedó en `ERR-005`.

## Requisitos externos pendientes para Go-Live

1. Configurar Supabase, service role, Redis y credenciales de la pasarela. No hay `.env`
   local ni dichas variables configuradas en este entorno. Gemini tampoco está configurado;
   la aplicación usa su fallback local.
2. Aplicar la migración SQL en Supabase, verificar permisos y obtener `/health` **200**
   en el dominio HTTPS. Sin servicios, el **503 observado es intencional** y evita un falso Go.
3. Cambiar `PAYMENT_ENV` a `production` con credenciales del comercio, registrar el webhook
   y conciliar una transacción completa. El sandbox remoto y los servicios reales no se
   verificaron; los tests de proveedor/DB/Redis utilizan dobles.
4. Confirmar disco persistente y única instancia para Webpay, proxy TLS y configuración
   GitHub→Render sobre `main`. El blueprint sigue iniciando en sandbox deliberadamente.
5. Validar la imagen en Docker/CI: no hay CLI Docker disponible en esta máquina, por lo
   que Dockerfile/Compose se revisaron estáticamente, sin construir ni ejecutar contenedores.
6. Integrar emisión tributaria y conciliación operativa. El DTE es un borrador preparado;
   no se emiten boletas ni se reporta al SII automáticamente.

## Commit y envío

Desde la raíz del repositorio, sobre la rama actual `main`, una sola línea:

```bash
git add -A && git commit -m "fix: audit production readiness and payment safeguards" && git push origin main
```

Incluye todos los cambios pendientes del proyecto, también los de las tareas anteriores.
El push activa el despliegue únicamente si Render tiene autodeploy conectado a `main`;
no se verificó esa configuración remota. Ejecutar después de completar los requisitos
externos para la puesta en marcha real.

Referencias: [IVA general 19%, SII](https://www.sii.cl/aprenda_sobre_impuestos/impuestos/impuestos_indirectos.htm),
[firma de webhooks, Mercado Pago](https://www.mercadopago.cl/developers/en/docs/subscriptions/additional-content/your-integrations/notifications/webhooks).
