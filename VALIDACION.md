# Revisión técnica — 17 de septiembre de 2026

## Resultado

Aplicación preparada para desplegar el panel operativo React y su API Express. No se realizó publicación externa. El proyecto original no contiene una tienda transaccional: pagos, inventario, checkout y couriers reales requieren desarrollo e integración adicionales.

## Hallazgos y correcciones

| Área | Hallazgo original | Estado final |
| --- | --- | --- |
| Tipos | `tsc --noEmit` pasaba, pero faltaban tipos explícitos de React | Tipos React/React DOM incorporados; se excluyen artefactos generados del análisis |
| Dependencias | CI exigía `npm ci` sin package-lock | pnpm y lockfile reproducible; instalación congelada verificada |
| Entorno | README pedía `.env.local`, servidor no lo cargaba; puerto fijo | Carga explícita, validación de rangos y `PORT` configurable |
| Gemini | Protección limitada a 429, sin timeout ni recuperación de otros fallos | Timeout abortable, reintento con jitter, circuito compartido, límite de concurrencia y presupuesto por proceso |
| Fallback | Respuesta IA vacía podía anunciar `usedAI: true` | Indicador correcto y referencias locales disponibles |
| Insights | Consultas sin validar, cache ilimitada, JSON generado sin estructura fiable | Validación de entradas y noticias, cache limitada a 100 entradas |
| Publicación | Servidor y frontend compartían directorio público; bundle CommonJS importaba dependencias ESM | Cliente aislado en `dist/client`, servidor ESM privado |
| Eventos | Escritura administrativa sin autenticación; éxito aparente aunque fallara persistencia | Token servidor a servidor, esquema de entrada y 503 ante fallos |
| Supabase | Peticiones sin timeout; clave incluida en URL de health | Timeouts y credenciales solo en cabeceras |
| Docker | Faltaba Dockerfile; Compose incluía recursos inválidos y secretos como build args | Dockerfile multietapa, usuario sin privilegios, secretos de runtime y Compose simplificado |
| CI | Despliegue y health check simulados mediante mensajes | Pipeline de validación real, sin publicación ficticia |
| E2E | Prueba buscaba títulos inexistentes | Selectores alineados con la UI, descargas PDF y JSON verificadas |

## Validaciones ejecutadas

- `tsc --noEmit`: sin errores, incluidos tipos de React.
- `pnpm install --offline --frozen-lockfile`: correcto.
- Vitest: 14 pruebas aprobadas (cálculos, entorno y resiliencia Gemini).
- `pnpm build`: correcto; genera frontend y servidor ESM.
- Playwright Chromium contra build de producción: 9 pruebas aprobadas.
- Comprobación de artefactos públicos: no contienen identificadores de secretos Gemini/Supabase; las rutas de servidor y entorno no entregan código ni secretos.

## Límites de esta verificación

- Pruebas locales con Node 24.19.0; Docker/CI configurados con Node 22, mínimo compatible 22.13.
- Docker no está instalado en el entorno: no se ejecutó una construcción o arranque real de contenedor. El workflow incluye esa comprobación.
- No se suministraron credenciales reales de Gemini ni Supabase: se verificaron fallback y fallos simulados, no cuota, permisos ni persistencia remota.
- Solo Chromium ejecutado; Firefox/WebKit siguen configurados pero no se descargaron ni probaron.
- Build con avisos no bloqueantes por comentarios de Zod y un bundle principal de aproximadamente 1,14 MB (337 KB gzip); la carga diferida por pestañas queda como optimización posterior.
- Contenido legal/comercial original no auditado. Cache, presupuesto Gemini y circuit breaker son por proceso, no distribuidos.

Instrucciones de ejecución, variables y despliegue en `README.md`.
