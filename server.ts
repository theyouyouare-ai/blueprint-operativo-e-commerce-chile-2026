import { healthHandler } from './server/health';
import { splitGrossCLP } from './src/checkout/model';
import { config as loadEnv } from 'dotenv';
import { GeminiResilience } from './server/gemini-resilience';
import { z } from 'zod';
import express from 'express';
import { checkoutRouter } from './src/server/checkout-router';
import { paymentConfig } from './src/server/payment-config';
import { paymentCors } from './src/server/payment-cors';
import { getPaymentRuntime } from './src/server/payment-runtime';
import { timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { productionSpa } from './server/production-spa';
import { createShopifyRouter } from './server/shopify-router';
import { GoogleGenAI } from '@google/genai';
import { STORE_FAQS, findMatchingFAQ, shouldTriggerEscalation, MOCK_TRACKING_DATABASE } from './src/data/chatbotKnowledge';
import { INITIAL_MARKET_NEWS, INITIAL_COMPLIANCE_MILESTONES, OFFICIAL_REGULATORY_SOURCES } from './src/data/marketInsightsData';
import { MarketNewsItem, GroundingSource, MarketInsightsResponse } from './src/types/marketInsights';
import { validateProductionEnv } from './server/env-validator';
import { recordConversionEventAdmin } from './server/supabase-admin';

loadEnv({ path: ['.env.local', '.env'], quiet: true });
const env = validateProductionEnv({ strict: true }).data;
const payments = paymentConfig();
// Fail startup if configured real-payment storage cannot be opened. Never silently simulate SDK errors.
getPaymentRuntime();
console.info(`[Payments] mode=${payments.mode}${payments.fallbackReason ? ' — ' + payments.fallbackReason : ''}`);
const app = express();
if (process.env.RENDER === 'true') app.set('trust proxy', 1);
else if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY.split(',').map(value => value.trim()));
const PORT = Number(env.PORT);
const gemini = new GeminiResilience({ timeoutMs: Number(env.GEMINI_TIMEOUT_MS), cooldownMs: Number(env.GEMINI_COOLDOWN_MS), maxConcurrent: 4, retries: 1 });
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use('/api', paymentCors(payments));
app.use('/api', (req, res, next) => {
  if (payments.mode === 'production' && !req.secure && req.path !== '/health') { res.status(400).json({ error: 'HTTPS requerido para pagos' }); return; }
  next();
});
app.use('/api', checkoutRouter);
app.use('/api/shopify', createShopifyRouter());
app.use(express.json({ limit: '32kb' }));

// Readiness: HTTP 200 only after active Supabase query and Redis PING.
app.get(['/health', '/api/health'], healthHandler());
app.get('/live', (_req, res) => { res.set('Cache-Control', 'no-store').json({ status: 'alive' }); });

// Endpoint seguro para eventos de conversión y auditoría (Bypass RLS con Service Role)
app.post('/api/v1/events', async (req, res) => {
  const startTime = Date.now();
  try {
    const token = process.env.EVENTS_API_TOKEN;
    if (!token) return res.status(503).json({ error: 'Ingesta de eventos no configurada' });
    const supplied = Buffer.from(req.headers.authorization || '');
    const expected = Buffer.from(`Bearer ${token}`);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return res.status(401).json({ error: 'No autorizado' });
    const input = z.object({
      eventId: z.string().min(1).max(128), eventName: z.string().min(1).max(128),
      grossAmountCLP: z.number().int().nonnegative().max(1e12),
      currency: z.literal('CLP').default('CLP'), metadata: z.record(z.string(), z.unknown()).optional()
    }).safeParse(req.body);
    if (!input.success) return res.status(400).json({ error: 'Evento inválido' });
    const { eventId, eventName, grossAmountCLP, currency, metadata } = input.data;

    // Cálculo tributario Ley N° 21.713 (19% IVA)
    const gross = Number(grossAmountCLP) || 0;
    const netRevenue = splitGrossCLP(gross).netCLP;
    const ivaAmount = gross - netRevenue;

    // Inserción defensiva no bloqueante con Supabase Service Role (Bypass RLS)
    const persisted = await recordConversionEventAdmin({
      eventId: String(eventId),
      eventName: String(eventName),
      grossAmountCLP: gross,
      netRevenueCLP: netRevenue,
      ivaAmountCLP: ivaAmount,
      currency: currency || 'CLP',
      metadata
    });

    return res.status(persisted ? 200 : 503).json({
      success: persisted,
      data: {
        eventId,
        eventName,
        grossAmountCLP: gross,
        netRevenueCLP: netRevenue,
        ivaAmountCLP: ivaAmount,
        persistedInDatabase: persisted,
        executionTimeMs: Date.now() - startTime
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[Events Endpoint] Manejo silencioso de error:', message);
    return res.status(503).json({
      success: false,
      error: 'No se pudo persistir el evento'
    });
  }
});

// Rate-limiting / quota circuit-breaker for Gemini API

const insightsCache = new Map<string, { data: MarketInsightsResponse; timestamp: number }>();
const INSIGHTS_CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes in-memory cache

// Chat endpoint
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        timeout: Number(env.GEMINI_TIMEOUT_MS),
        retryOptions: { attempts: 1 }
      }
    });
  }
  return genAIClient;
}

const SYSTEM_INSTRUCTION = `Eres el Auditor Global de Negocios E-commerce y Consultor Senior de Operaciones en Chile (Actualizado a Septiembre 2026), impulsado por Gemini 3.8 Flash dentro del Blueprint Operativo.

TU ROL Y MODO DE OPERACIÓN:
Operas en modo "Auditor Global de Negocios E-commerce" para evaluar la viabilidad general de proyectos, estrategias de escalamiento, optimización de capital de trabajo, unit economics, compliance tributario Ley N° 21.713 y arquitectura logística transfronteriza y local.

TU OBJETIVO PRINCIPAL:
Guiar a fundadores, directores de operaciones y merchants en:
1. Viabilidad General del Proyecto: Evaluación del costo landed, markup óptimo (mínimo 2.5x a 3.2x), margen neto final saludable (> 18%-25%) y ROAS de equilibrio (Breakeven ROAS).
2. Optimización del Capital de Trabajo: Ciclos de caja entre pasarelas de pago (liquidación D+1 de Webpay vs D+14 en planes básicos de MP), crédito de proveedores internacionales y gestión de stock de seguridad.
3. Estrategias de Escalamiento: Cuándo escalar presupuesto de Ads (pasar de TikTok Ads $10 USD/día a Meta Advantage+ $30+ USD/día) y cuándo tercerizar operaciones a un Centro 3PL de Fulfillment.
4. Auditoría Tributaria y Aduanera (Ley N° 21.713): Validación de inicio de actividades (código SII 479100), compensación de IVA Débito vs. IVA Crédito Fiscal en F29 y cumplimiento del umbral aduanero de US$ 500.
5. Arquitectura Logística 2026: Couriers líderes (Blue Express, Starken, Chilexpress, Chazki), estándar de peso volumétrico (L*W*H / 4.000) y estrategia de flete subsidiado sobre $29.990 CLP.
6. Atención al Cliente y Compliance SERNAC (Ley N° 19.496): Derecho irrenunciable 3x3 y garantía legal obligatoria de 6 meses.

REGLAS FISCALES Y FINANCIERAS DE RESPUESTA (ESTRICTO CUMPLIMIENTO):
1. NORMATIVA FISCAL CHILENA VIGENTE (2026):
   - Aplica estrictamente la Ley N° 21.713 de Cumplimiento Tributario: eliminación total de la exención de IVA en importaciones de bajo valor (antes US$ 41). Todo producto importado paga 19% de IVA sin excepción.
   - Retenciones de IVA y reporte automático del SII a través de pasarelas de pago locales y plataformas digitales.
   - Emisión obligatoria de Boleta Electrónica (DTE 39) o Factura Electrónica (DTE 33) con IVA desglosado.
   - Arancel Ad-Valorem: 6% general aplicable sobre valor CIF (exento o simplificado para envíos de hasta US$ 500 bajo regímenes de mensajería internacional).

2. TASA DE CAMBIO FIJA DE REFERENCIA:
   - USD 1 = CLP 940 (Dólar observado de referencia 2026).

3. ESTRUCTURA UNITARIA DE COSTOS (DESGLOSE OBLIGATORIO):
   Al responder sobre costos de un producto importado, desglosa siempre de manera ordenada:
   a) Costo FOB en Fábrica (USD y CLP).
   b) Flete Internacional + Seguro (CIF = FOB + Flete).
   c) Arancel Aduanero (6% Ad-Valorem si aplica).
   d) IVA de Importación 19% (Ley N° 21.713 sobre CIF + Arancel).
   e) Despacho Local / Última Milla en Chile (típicamente $3.800 CLP con Starken/Chilexpress/Blue Express).
   f) Costo Landed Total en CLP puesto en bodega/cliente.
   g) Pauta Publicitaria / CAC estimado por canal ($3.800 TikTok Ads, $4.500 Meta Ads, $6.200 Google Shopping).
   h) Comisión de Pasarela de Pago (~3,51% a 3,80% con IVA en Webpay Plus o Mercado Pago).

4. PRECIO DE VENTA AL PÚBLICO (PVP) Y MARGEN NETO:
   - Sugiere siempre precios de venta en CLP con IVA incluido que aseguren AL MENOS un 20% a 25% de Margen Neto (EBITDA unitario) tras absorber Costo Landed, CAC y comisiones de pasarela.
   - Si el margen resultante es inferior al 20%, adviértelo como un riesgo operativo e indica el PVP mínimo requerido.
   - Proporciona el ROAS Mínimo de Equilibrio (Break-even ROAS = 1 / Margen Bruto Decimal) y el ROAS Objetivo recomendado.

5. NICHOS VALIDADOS EN CHILE (TAB 3):
   - Mascotas (Pet Wellness): Alta recompra y fidelidad, ideal para TikTok Ads ($3.800 CAC).
   - Belleza & Skincare: Alto LTV y prueba de variantes, ticket medio $24.990 - $29.990 CLP, ideal para Meta Ads.
   - Hogar & Iluminación LED: Solución funcional inmediata, teletrabajo y smart home, ticket $36.990 - $49.990 CLP.
   - Tecnología & Gadgets: Alto ticket, búsqueda de alta intención en Google Shopping y YouTube, ticket $45.990 - $59.990 CLP.

6. CUMPLIMIENTO TRIBUTARIO, LEGAL Y OPERATIVA SII (TAB 4 - LEY N° 21.713):
   - Códigos de Actividad Económica en el SII para E-commerce:
     * Código 479100 ("Venta al por menor por correo, por internet y vía telefónica"): Código principal obligatorio en 1ra Categoría para cualquier tienda Shopify, WooCommerce o marketplace. Afecto a IVA 19%.
     * Código 469000 ("Venta al por mayor no especializada"): Código secundario indispensable para vender packs a empresas o distribuir a revendedores (B2B).
     * Régimen Tributario recomendado: Pro-Pyme General (Art. 14 D3) o Pro-Pyme Transparente (Art. 14 D8).
   - Procedimiento de Internación Aduanera y Umbral de US$ 500:
     * Envíos hasta US$ 500 CIF (Couriers Express como DHL, FedEx, UPS): Trámite simplificado. Arancel 0%, pero IVA 19% OBLIGATORIO por Ley 21.713. No requiere Agente de Aduanas.
     * Envíos superiores a US$ 500 CIF: OBLIGATORIO contratar un Agente de Aduanas colegiado para tramitar la Declaración de Ingreso (DIN) formal. Paga Arancel 6% Ad-Valorem + IVA 19% sobre (CIF + Arancel).
   - Recuperación de IVA en Formulario 29 (F29):
     * Para que el 19% pagado en aduanas sea Crédito Fiscal (F29) y no un costo perdido, el merchant DEBE exigir al courier o agente que consigne el RUT de su SpA en la DIN o guía de despacho internacional. Así se refleja en el Registro de Compras y Ventas (RCV).
     * Fórmula F29: Impuesto Líquido a Pagar = IVA Débito (19% ventas) - [IVA Crédito Aduana + IVA Crédito Compras Locales].
   - Ley N° 21.713 y Defensa ante Citaciones del SII:
     * Alerta bancaria: Bancos y pasarelas informan al SII cuentas con más de 50 transferencias o abonos reiterados.
     * Estrategia de defensa: Constituir SpA urgente en "Tu Empresa en un Día", formalizar inicio de actividades retroactivo razonable, respaldar transferencias con comprobantes de pago de proveedores internacionales (invoices, guías) y emitir DTEs rectificatorios para evitar sanciones penales por comercio clandestino (Art. 97 N° 10).

7. ATENCIÓN AL CLIENTE Y SOPORTE:
   - Respeto irrestricto a la garantía legal de 6 meses por fallas de fábrica según la Ley SERNAC (N° 19.496).
   - Derecho irrenunciable 3x3 del consumidor: Devolución total del dinero, cambio por producto nuevo, o reparación gratuita.
   - Opciones de escalamiento a agente humano si el usuario solicita "humano", "ejecutivo" o ticket.

8. ARQUITECTURA LOGÍSTICA, FULFILLMENT & APIS DE ENVÍOS EN CHILE (TAB 5 - 2026):
   - Comparativa de Couriers y Tarifas:
     * Starken: 400+ agencias nacionales. Descuento ~18% al cliente si retira en sucursal. Ideal para paquetes voluminosos o pesados (> 3 kg) y provincias. Tarifa base ~$3.200 CLP.
     * Blue Express: Red de +2.000 puntos Blue y Lockers PUDO 24/7. Reduce tasa de fallo por "morador ausente" a < 2%. Integración API v2 y plugins masivos. Tarifa base ~$2.990 CLP.
     * Chilexpress: Entrega prioritaria día hábil siguiente garantizada (Priority 10:30 / 12:00). SLA de puntualidad 98.4%. Máxima cobertura en zonas remotas e insulares. Tarifa base ~$3.600 CLP.
     * Chazki / 99Minutos: Especialistas de última milla Same-Day en RM urbana con corte a las 13:00 hrs. Aumenta la tasa de conversión en Santiago hasta un +35%. Tarifa base ~$3.100 CLP.
   - Regla de Peso Volumétrico Estándar Courier en Chile:
     * Fórmula: Peso Volumétrico (kg) = (Largo cm x Ancho cm x Alto cm) / 4.000.
     * El courier siempre factura el mayor entre el peso real y el volumétrico. Enseña a optimizar dimensiones de caja kraft para evitar cobros sorpresa.
   - Unit Economics: In-House (Propio) vs. 3PL Fulfillment:
     * Modelo In-House: Conviene con < 350 envíos/mes para mantener costos fijos en cero (armado en taller o garage).
     * Modelo 3PL (Blue Fulfillment, Shipit, Envíame, Ecomsur): Conviene desde > 350 - 500 envíos/mes. Se eliminan arriendos fijos de bodega y contratos de operarios; el 3PL cobra almacenamiento por pallet (~$28.000 - $30.000 CLP/mes) + Pick & Pack por pedido (~$850 - $1.100 CLP) y fletes con descuento corporativo por volumen (10-15% más baratos).
   - Estrategias de Despacho y Conversión:
     * "Envío Gratis a partir de un ticket mínimo ($29.990 CLP)" vs Flete Real en checkout. Cobrar $3.800+ de flete en checkout eleva el abandono de carrito a > 55%. Subsidiar $2.990 dentro del margen bruto mediante bundles y cross-sells.
   - Integración de Webhooks y Arquitectura de APIs:
     * Ciclo de 5 estados: ORDER_CREATED -> LABEL_GENERATED (ZPL/PDF 10x15) -> IN_TRANSIT (Hub) -> OUT_FOR_DELIVERY -> DELIVERED (POD) / DELIVERY_FAILED (Reintento o desvío a Locker).
     * Route Handlers en Next.js con validación Zod y verificación de firma HMAC en header x-courier-signature.
   - Logística Inversa y Devoluciones SERNAC (Ley N° 19.496):
     * 6 meses de garantía legal por fallas técnicas (derecho 3x3: devolución 100%, cambio o reparación).
     * El flete de devolución no se cobra al cliente; se genera etiqueta prepagada para depósito en sucursal Blue Express o Starken.

Mantén un tono técnico, profesional, analítico, directo y orientado a métricas accionables (Margen Neto, ROAS, CAC, Break-even, Ahorro F29, SLA Logístico).`;

app.post('/api/chat', async (req, res) => {
  try {
    const input = z.object({
      message: z.string().trim().min(1).max(4000),
      conversationHistory: z.array(z.object({ sender: z.enum(['user', 'bot', 'model', 'assistant', 'system', 'agent']), text: z.string().max(4000) })).max(50).optional()
    }).safeParse(req.body);
    if (!input.success) return res.status(400).json({ error: 'Mensaje o historial inválido' });
    const { message, conversationHistory } = input.data;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    const trimmed = message.trim();
    const isEscalation = shouldTriggerEscalation(trimmed);

    // Check if user is asking for order tracking
    const orderMatch = trimmed.match(/#?CL-?\d{4}/i);
    let trackingInfo = null;
    if (orderMatch) {
      const cleanId = orderMatch[0].replace('#', '').replace('-', '').toUpperCase();
      const mappedKey = cleanId.startsWith('CL') ? `CL-${cleanId.slice(2)}` : `CL-${cleanId}`;
      if (MOCK_TRACKING_DATABASE[mappedKey]) {
        trackingInfo = MOCK_TRACKING_DATABASE[mappedKey];
      } else {
        trackingInfo = null;
      }
    }

    // Try Gemini if client initialized and key exists and not in rate-limit cooldown
    const ai = getGenAI();
    let replyText = '';
    let usedAI = false;

    if (ai && !gemini.status.active) {
      try {
        const contents = [];
        if (Array.isArray(conversationHistory)) {
          for (const item of conversationHistory.slice(-4)) {
            contents.push({
              role: item.sender === 'user' ? 'user' : 'model',
              parts: [{ text: item.text }]
            });
          }
        }
        contents.push({
          role: 'user',
          parts: [{ text: trimmed }]
        });

        const response = await gemini.run(signal => ai.models.generateContent({
          model: env.GEMINI_MODEL!,
          contents,
          config: {
            abortSignal: signal,
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.3,
          }
        }));

        replyText = response.text?.trim() || '';
        usedAI = Boolean(replyText);
      } catch (err: any) {
        // Fallback gracefully to local knowledge without logging raw stack
      }
    }

    // Grounded fallback if Gemini is not configured or failed
    if (!replyText) {
      if (trackingInfo) {
        replyText = `Ejemplo de seguimiento (datos de demostración, sin conexión al courier) para el pedido **${trackingInfo.orderId}**:\n\n• **Estado actual:** ${trackingInfo.status}\n• **Operador logístico:** ${trackingInfo.carrier}\n• **Fecha estimada de entrega:** ${trackingInfo.eta}\n• **Ubicación:** ${trackingInfo.location}\n\nSi necesitas agilizar la entrega o tienes alguna duda específica, indícamelo o solicita atención con un ejecutivo.`;
      } else {
        const matched = findMatchingFAQ(trimmed);
        if (matched) {
          replyText = `${matched.detailedAnswer}`;
        } else if (isEscalation) {
          replyText = `Entiendo perfectamente tu situación. Para brindarte la atención detallada y personalizada que mereces, voy a derivar tu consulta directamente con nuestro equipo de **Soporte Humano Especializado**. Por favor confirma tus datos a continuación para generar tu ticket de atención prioritaria o abrir un chat directo por WhatsApp.`;
        } else {
          replyText = `¡Hola! Soy tu asistente de atención de la tienda. Con gusto te ayudo con información sobre:\n\n• **Productos:** Fichas técnicas de Cepillo de Vapor, Espátula Ultrasónica y Lámpara Levitante.\n• **Tiempos de Despacho:** Envíos a todo Chile (15-25 días estándar o 24-72h express).\n• **Políticas de Devolución:** 6 meses de garantía legal SERNAC y 30 días de satisfacción.\n• **Medios de Pago:** Webpay Plus (Redcompra / Crédito en cuotas), Mercado Pago y Boleta DTE 39.\n\n¿En qué te puedo asesorar hoy? También puedes escribir "hablar con humano" si requieres atención de un ejecutivo.`;
        }
      }
    }

    return res.json({
      text: replyText,
      usedAI,
      isEscalation: isEscalation || trimmed.toLowerCase().includes('ticket') || trimmed.toLowerCase().includes('humano'),
      trackingData: trackingInfo,
      trackingIsDemo: Boolean(trackingInfo)
    });
  } catch (error: any) {
    console.error('Error handling chat:', error);
    res.status(500).json({
      error: 'Error interno al procesar el mensaje',
      text: 'Ocurrió un inconveniente temporal. Por favor contáctanos directamente o solicita hablar con un agente humano.'
    });
  }
});

// Market Insights Endpoint with Google Search Grounding Tool
app.all(['/api/market-insights', '/api/market-insights/search'], async (req, res) => {
  try {
    const input = z.object({ topic: z.enum(['all', 'aduanas_sii', 'logistica', 'sernac', 'pasarelas']), query: z.string().trim().max(500) }).safeParse({ topic: req.query.topic ?? req.body?.topic ?? 'all', query: req.query.q ?? req.body?.query ?? '' });
    if (!input.success) return res.status(400).json({ error: 'Consulta inválida' });
    const { topic, query: customQuery } = input.data;
    const isExplicitRefresh = req.query.refresh === 'true' || req.body?.refresh === true;

    // Check memory cache first to protect quota
    const cacheKey = `${topic}:${customQuery.toLowerCase()}`;
    const cached = insightsCache.get(cacheKey);
    if (!isExplicitRefresh && cached && (Date.now() - cached.timestamp < INSIGHTS_CACHE_TTL_MS)) {
      return res.json(cached.data);
    }

    const ai = getGenAI();
    let liveNews: MarketNewsItem[] = [];
    let groundingSources: GroundingSource[] = [...OFFICIAL_REGULATORY_SOURCES];
    let executiveSummary = '';
    let usedSearchTool = false;
    let searchQueriesUsed: string[] = [];

    // Only invoke live Gemini Search grounding if explicitly refreshed or custom query,
    // and if not in quota cooldown
    const shouldAttemptLiveSearch = (customQuery.length > 0 || isExplicitRefresh) && !gemini.status.active;

    if (ai && shouldAttemptLiveSearch) {
      try {
        const searchQuery = customQuery 
          ? `normativa comercio electronico chile regulaciones aduanas ${customQuery}`
          : `noticias regulaciones e-commerce chile aduanas ley 21713 IVA importaciones SERNAC logística 2026`;

        const prompt = `Actúa como analista senior de inteligencia regulatoria y logística de e-commerce en Chile.
Utiliza la herramienta de búsqueda de Google (Google Search tool) para investigar las noticias y regulaciones más recientes sobre:
- Ley N° 21.713 de Cumplimiento Tributario en Chile (fin de la exención de 41 dólares, cobro de 19% IVA en compras internacionales en plataformas como AliExpress, Shein o Temu).
- Fiscalización del Servicio Nacional de Aduanas y convenios con Correos de Chile / couriers express.
- Exigencias del SII a plataformas de pago (Webpay, Mercado Pago) de inicio de actividades y control de más de 50 transferencias mensuales.
- Normativas y fiscalizaciones de SERNAC sobre comercio electrónico y derechos del consumidor.
- Novedades logísticas de última milla en Chile (tiempos de entrega, aranceles aduaneros > USD 500).

Tema específico solicitado por el usuario: "${topic}" ${customQuery ? `(Consulta personalizada: ${customQuery})` : ''}.

Entrega tu respuesta estructurada exactamente en formato JSON (sin texto introductorio antes o después) con el siguiente formato:
\`\`\`json
{
  "executiveSummary": "Resumen ejecutivo en 2 a 3 oraciones del panorama actual y cambios recientes detectados.",
  "news": [
    {
      "id": "live-1",
      "title": "Título claro de la noticia o regulación",
      "summary": "Explicación concisa del hecho y contexto",
      "source": "Nombre del medio o entidad emisora (ej: Servicio de Impuestos Internos, Aduanas de Chile, SERNAC, Diario Financiero, etc.)",
      "url": "URL del sitio o medio",
      "date": "Fecha o indicación de tiempo reciente (ej: Septiembre 2026)",
      "category": "aduanas_sii",
      "impactLevel": "critico",
      "affectedEntity": "Entidad afectada o fiscalizadora",
      "actionForStore": "Recomendación operativa y práctica para el dueño de la tienda online",
      "tags": ["tag1", "tag2"]
    }
  ]
}
\`\`\`
Los valores de category permitidos son: "aduanas_sii", "logistica", "sernac", "pasarelas".
Los valores de impactLevel permitidos son: "critico", "alto", "medio", "informativo".
Asegúrate de incluir mínimo 4 y máximo 6 noticias altamente relevantes, verificadas y de alto impacto operativo.`;

        const response = await gemini.run(signal => ai.models.generateContent({
          model: env.GEMINI_MODEL!,
          contents: prompt,
          config: {
            abortSignal: signal,
            tools: [{ googleSearch: {} }],
          }
        }));

        // Extract Search Grounding metadata
        const candidate = response.candidates?.[0];
        const chunks = candidate?.groundingMetadata?.groundingChunks || [];
        const webQueries = candidate?.groundingMetadata?.webSearchQueries || [];
        if (webQueries.length > 0) {
          searchQueriesUsed = webQueries;
        } else {
          searchQueriesUsed = [searchQuery];
        }

        if (chunks.length > 0) {
          usedSearchTool = true;
          const extractedSources: GroundingSource[] = [];
          for (const chunk of chunks) {
            if (chunk.web?.uri) {
              extractedSources.push({
                title: chunk.web.title || chunk.web.uri,
                uri: chunk.web.uri
              });
            }
          }
          if (extractedSources.length > 0) {
            const existingUrls = new Set(groundingSources.map(s => s.uri));
            for (const s of extractedSources) {
              if (!existingUrls.has(s.uri)) {
                groundingSources.unshift(s);
                existingUrls.add(s.uri);
              }
            }
          }
        }

        const rawText = response.text || '';
        const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, rawText];
        const jsonStr = jsonMatch[1]?.trim() || rawText.trim();
        
        try {
          const parsed = JSON.parse(jsonStr);
          if (z.object({ executiveSummary: z.string().optional(), news: z.array(z.object({
            id: z.string().optional(), title: z.string(), summary: z.string(), source: z.string(),
            url: z.string().url().refine(url => /^https?:\/\//.test(url)), date: z.string(),
            category: z.string(), impactLevel: z.string(), affectedEntity: z.string(),
            actionForStore: z.string(), tags: z.array(z.string())
          })).min(1).max(6) }).safeParse(parsed).success) {
            liveNews = parsed.news.map((item: any, idx: number) => ({
              id: item.id || `live-${Date.now()}-${idx}`,
              title: item.title || 'Actualización regulatoria en Chile',
              summary: item.summary || '',
              source: item.source || 'Búsqueda Google / Fuentes Oficiales',
              url: item.url || (groundingSources[idx]?.uri || 'https://www.aduana.cl'),
              date: item.date || 'Reciente 2026',
              category: ['aduanas_sii', 'logistica', 'sernac', 'pasarelas'].includes(item.category) ? item.category : 'aduanas_sii',
              impactLevel: ['critico', 'alto', 'medio', 'informativo'].includes(item.impactLevel) ? item.impactLevel : 'alto',
              affectedEntity: item.affectedEntity || 'Aduanas / SII',
              actionForStore: item.actionForStore || 'Verificar cumplimiento de IVA y emisión de DTE.',
              tags: Array.isArray(item.tags) ? item.tags : ['Chile 2026', 'E-commerce']
            }));
            if (parsed.executiveSummary) {
              executiveSummary = parsed.executiveSummary;
            }
          }
        } catch (parseErr) {
          if (rawText.length > 50) {
            executiveSummary = rawText.slice(0, 300) + '...';
          }
        }
      } catch (geminiErr: any) {
        // Shared circuit handles outages; continue with local content.
      }
    }

    // Fallback or blend with high-quality verified knowledge base
    let finalNews = liveNews.length > 0 ? liveNews : [...INITIAL_MARKET_NEWS];

    // Filter by topic if requested
    if (topic && topic !== 'all') {
      finalNews = finalNews.filter(n => n.category === topic);
      if (finalNews.length === 0) {
        finalNews = INITIAL_MARKET_NEWS.filter(n => n.category === topic);
      }
    }

    // Filter by search query if custom search entered
    if (customQuery && customQuery.trim().length > 1) {
      const q = customQuery.toLowerCase();
      const queryFiltered = finalNews.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q)) ||
        n.affectedEntity.toLowerCase().includes(q)
      );
      if (queryFiltered.length > 0) {
        finalNews = queryFiltered;
      }
    }

    if (!executiveSummary) {
      executiveSummary = 'Panorama regulatorio 2026 en Chile: Plena vigencia de la Ley N° 21.713 que elimina la exención de 41 USD para compras internacionales gravando todo con 19% IVA, fiscalización del SII a ventas sin boleta electrónica mediante control de 50 transferencias mensuales y estrictos estándares SERNAC en plazos de entrega.';
    }

    const payload: MarketInsightsResponse = {
      lastUpdated: new Date().toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      sourceType: usedSearchTool && liveNews.length > 0 ? 'google_search_live' : 'grounded_database',
      executiveSummary,
      searchQueriesUsed: searchQueriesUsed.length > 0 ? searchQueriesUsed : ['regulaciones e-commerce chile 2026 ley 21.713 aduanas'],
      groundingSources: groundingSources.slice(0, 8),
      news: finalNews,
      milestones: INITIAL_COMPLIANCE_MILESTONES,
      disclaimer: liveNews.length > 0 ? 'Información generada por IA: verificar las fuentes antes de tomar decisiones.' : 'Contenido de referencia local; no actualizado en tiempo real.'
    };

    if (insightsCache.size >= 100) insightsCache.delete(insightsCache.keys().next().value!);
    insightsCache.set(cacheKey, { data: payload, timestamp: Date.now() });
    return res.json(payload);
  } catch (error: any) {
    console.error('Error fetching market insights:', error);
    res.status(500).json({
      error: 'Error al consultar insights de mercado',
      lastUpdated: new Date().toISOString(),
      sourceType: 'grounded_database',
      executiveSummary: 'Error al conectar con el servicio de búsqueda en vivo. Mostrando base de datos de respaldo.',
      news: INITIAL_MARKET_NEWS,
      milestones: INITIAL_COMPLIANCE_MILESTONES,
      groundingSources: OFFICIAL_REGULATORY_SOURCES
    });
  }
});

app.use('/api', (_req, res) => { res.status(404).json({ error: 'Endpoint no encontrado' }); });
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(error.status === 413 ? 413 : 400).json({ error: 'Solicitud inválida' });
});

// Start server and mount Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fileURLToPath(new URL('./client/', import.meta.url));
    app.use(productionSpa(distPath));
    console.info(`[Startup] Sirviendo SPA desde ${distPath}`);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`E-commerce Support Server running on http://0.0.0.0:${PORT}`);
  });
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  });
}

startServer().catch((error) => { console.error('No se pudo iniciar el servidor:', error); process.exit(1); });
