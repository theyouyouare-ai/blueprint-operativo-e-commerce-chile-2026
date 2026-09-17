# Blueprint Operativo E-commerce Chile 2026

Panel de planificación y simulación para operaciones de e-commerce. React 19 + Vite + Tailwind, con API Express y Gemini exclusivamente en el servidor.

## Estructura y componentes

- `src/App.tsx`, `src/main.tsx`: aplicación SPA y navegación entre secciones.
- `src/context/AppContext.tsx`: estado compartido de simuladores y dashboard.
- `src/components/`: auditoría, calculadora, nichos, compliance, logística, dashboard, estrategia comercial, sprint, atención al cliente, exportaciones PDF/JSON e inteligencia de mercado.
- `src/components/tabs/`: implementación de las pestañas especializadas.
- `src/lib/`: motores financieros/logísticos/compliance, PDF y cliente administrativo Supabase.
- `src/data/`: datos de referencia, FAQ y seguimiento de pedidos de demostración.
- `server.ts`: API de chat, inteligencia de mercado, salud e ingesta autenticada de eventos.
- `server/gemini-resilience.ts`: política compartida de resiliencia y control de gasto.
- `lib/` y `app/components/tabs/`: reexportaciones de compatibilidad; no son una segunda app Next.js.
- `tests/unit/`, `tests/e2e/`: pruebas de cálculos, configuración, resiliencia, API y navegador.

## Ejecutar

Node.js 22.13 o superior y pnpm 11.19.0:

```sh
npm install -g pnpm@11.19.0
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Abrir http://localhost:3000. El servidor carga `.env.local` y luego `.env`, sin sobrescribir las variables inyectadas por el host. El lockfile canónico es `pnpm-lock.yaml`; `bun.lock` es un archivo heredado del ZIP y no se utiliza.

## Validar y desplegar

```sh
pnpm typecheck                       # tsc --noEmit
pnpm test:unit
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e --project=chromium      # levanta el build de producción
pnpm start
```

El build genera `dist/client/` (público) y `dist/server.js` (privado). El host debe ejecutar el servidor Node, no limitarse a publicar archivos estáticos ni usar `vite preview`. `PORT` es configurable y `/api/health` sirve como health check. El proceso maneja SIGTERM/SIGINT.

Para contenedores:

```sh
docker compose --env-file .env.local -f docker-compose.prod.yml config --quiet
docker compose --env-file .env.local -f docker-compose.prod.yml up --build -d
```

La imagen usa un usuario sin privilegios, incluye health check y recibe secretos solo en tiempo de ejecución. Configurar HTTPS y dominio en el proveedor de alojamiento. El workflow de GitHub valida tipos, pruebas, build y Docker; no publica ni anuncia un despliegue que no ha ocurrido.

## Gemini y degradación controlada

- `GEMINI_API_KEY`: secreto del servidor; vacío mantiene FAQ y referencias locales disponibles.
- `GEMINI_MODEL`: configurable, por defecto `gemini-3.8-flash`. Confirmar acceso al modelo en el proyecto de Google antes de activar IA.
- `GEMINI_TIMEOUT_MS`: 12000 por intento; un reintento para errores transitorios de red, timeout o 5xx, con espera exponencial y jitter. Máximo aproximado por operación: 24,5 segundos con la configuración predeterminada.
- `GEMINI_COOLDOWN_MS`: 60000. Un 429 abre inmediatamente el circuito sin reintentar; fallos persistentes o credenciales/modelo inválidos también activan la pausa. Tras la pausa se permite una sola solicitud de recuperación.
- Máximo cuatro operaciones simultáneas y treinta operaciones nuevas por minuto por proceso, compartidas por chat y búsqueda. Cada operación admite como máximo dos intentos. Al exceder límites se usa contenido local.
- Cache de insights: 20 minutos y 100 entradas. Actualizaciones explícitas omiten la cache, pero respetan el circuito y el presupuesto.
- `/api/health` muestra configuración y estado del circuito. Una clave configurada no significa que su cuota/acceso esté validado.
- La cache, el circuito y el presupuesto son locales al proceso: para múltiples réplicas se necesita coordinación externa y límites de cuota del proveedor.

Configuración SDK contrastada con la [documentación oficial de HttpOptions](https://googleapis.github.io/js-genai/release_docs/interfaces/types.HttpOptions.html).

## Persistencia opcional

`NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` activan Supabase en el backend. No utilizar prefijos `VITE_` para secretos. La ingesta `POST /api/v1/events` requiere `Authorization: Bearer <EVENTS_API_TOKEN>` y una tabla `conversion_events` con las columnas utilizadas en `src/lib/supabase-admin.ts`. El token es para integraciones servidor a servidor; no debe incluirse en el navegador. Sin token la ruta responde 503; si la escritura falla devuelve 503 con `success: false`.

PostgreSQL y Redis del Compose original no estaban conectados a ningún cliente real; se retiraron esos contenedores de la configuración activa. La salud de Supabase usa un timeout de 3 segundos y las escrituras de 5 segundos.

## Checkout y pagos

`/checkout` incluye carrito, formulario y Webpay Plus. La selección condicional de simulador, sandbox y producción, la persistencia y el despliegue en Render están descritos en [DEPLOYMENT.md](DEPLOYMENT.md).

## Alcance comercial

Este proyecto es un blueprint operativo desplegable, no una tienda transaccional completa. Incluye checkout y un adaptador oficial Webpay Plus configurable. No incluye Mercado Pago, inventario conectado ni seguimiento real de couriers; tampoco emisión efectiva de DTE al SII. Los tickets y simulaciones del navegador no equivalen a persistencia multiusuario. El seguimiento de ejemplo se identifica como demostración. Los textos legales, tarifas y cifras de mercado son referencias del contenido original y requieren revisión independiente antes de utilizarlos comercialmente; esta intervención valida software, no certifica normativa.
# blueprint-operativo-e-commerce-chile-2026
