import { FAQItem, ChatMessage, EscalationTicket } from '../types/chat';

export const STORE_FAQS: FAQItem[] = [
  // 1. PRODUCTOS
  {
    id: 'prod-vapor',
    category: 'productos',
    question: '¿Qué características tiene el Cepillo de Vapor para Mascotas?',
    shortAnswer: 'Cepillo 3 en 1 con vapor tibio, cerdas de silicona anti-tirones y batería recargable USB para perros y gatos.',
    detailedAnswer: 'El Cepillo de Vapor para Mascotas 3 en 1 combina vaporización ultrasónica con cerdas suaves de silicona médica. Desenreda el pelaje, elimina pelos sueltos sin tirones y desinfecta suavemente. Tanque recargable de 20ml para agua o aceites esenciales hipoalergénicos, batería USB de hasta 80 min de autonomía. Incluye 6 meses de garantía legal SERNAC.',
    tags: ['cepillo', 'mascotas', 'vapor', 'gato', 'perro', 'pelo', 'características']
  },
  {
    id: 'prod-espatula',
    category: 'productos',
    question: '¿Cómo funciona la Espátula Ultrasónica Facial de Skincare?',
    shortAnswer: 'Genera 24.000 vibraciones por segundo con 4 modos: Limpieza profunda, Iones+, Iones- y Lifting EMS.',
    detailedAnswer: 'Nuestra Espátula Ultrasónica Facial opera a 24 kHz eliminando puntos negros, células muertas y exceso de sebo sin irritar la piel. Incorpora modos de infusión de sérums (Ion-) y microcorrientes EMS para reafirmar el contorno facial. Cabezal de acero inoxidable quirúrgico 316 hipoalergénico y certificación CE/RoHS.',
    tags: ['espatula', 'facial', 'skincare', 'ultrasonica', 'puntos negros', 'limpieza', 'belleza']
  },
  {
    id: 'prod-lampara',
    category: 'productos',
    question: '¿La Lámpara Levitante es compatible con cualquier celular?',
    shortAnswer: 'Sí, la base incluye cargador inalámbrico Qi estándar de 15W compatible con iPhone, Samsung, Xiaomi y más.',
    detailedAnswer: 'La Lámpara Flotante Levitante Magnética suspende una bombilla LED de luz cálida mediante electroimanes de neodimio y tecnología de inducción por aire. Su base de madera de nogal integra una estación de carga inalámbrica Qi de 15W con protección térmica contra sobrecargas.',
    tags: ['lampara', 'levitante', 'inalambrico', 'celular', 'carga', 'hogar', 'qi']
  },

  // 2. PLAZOS DE ENVÍO (SHIPPING TIMES)
  {
    id: 'env-tiempos',
    category: 'envios',
    question: '¿Cuánto demora el despacho a mi domicilio en Chile?',
    shortAnswer: 'Envíos estándar: 15 a 25 días hábiles. Envíos locales express (Dropi): 24 a 72 horas hábiles.',
    detailedAnswer: 'Manejamos dos modalidades de despacho transparentes a todo Chile:\n• Envíos Estándar Internacionales (vía AliExpress/CJ/Correos de Chile): 15 a 25 días hábiles con número de seguimiento internacional entregado a domicilio.\n• Despacho Local Rápido (vía Dropi Chile / Chilexpress / Blue Express): 24 a 72 horas hábiles en Región Metropolitana y capitales regionales.',
    tags: ['envio', 'despacho', 'tiempo', 'demora', 'plazo', 'cuanto tarda', 'dias', 'llegada']
  },
  {
    id: 'env-seguimiento',
    category: 'envios',
    question: '¿Cómo puedo rastrear el estado de mi compra?',
    shortAnswer: 'Te enviamos un código de seguimiento web por email y WhatsApp tan pronto el paquete sea despachado.',
    detailedAnswer: 'Apenas procesamos tu orden (24-48h), recibirás automáticamente un enlace de rastreo en tiempo real para consultar en la web de Correos de Chile, Chilexpress o Blue Express. También puedes escribirnos aquí mismo tu número de orden (ej: #CL-2026-8812) y te informamos el estado actual.',
    tags: ['rastreo', 'seguimiento', 'tracking', 'donde esta', 'codigo', 'paquete', 'guia']
  },
  {
    id: 'env-cobertura',
    category: 'envios',
    question: '¿Hacen envíos a regiones y zonas extremas de Chile?',
    shortAnswer: 'Sí, despachamos a las 16 regiones de Chile, desde Arica y Parinacota hasta Magallanes.',
    detailedAnswer: 'Cubrimos todo el territorio nacional continental e insular. Para zonas extremas (Aysén y Magallanes) los plazos pueden extenderse entre 3 a 5 días hábiles adicionales debido a los tramos de conectividad aérea o marítima.',
    tags: ['regiones', 'zonas extremas', 'arica', 'punta arenas', 'cobertura', 'chile']
  },

  // 3. POLÍTICAS DE DEVOLUCIÓN Y GARANTÍA (RETURN POLICIES)
  {
    id: 'dev-garantia',
    category: 'devoluciones',
    question: '¿Cuál es la política de garantía y devoluciones bajo la ley chilena?',
    shortAnswer: 'Garantía legal SERNAC de 6 meses por fallas + Garantía voluntaria de satisfacción de 30 días corridos.',
    detailedAnswer: 'Cumplimos rigurosamente con la Ley N° 19.496 del Consumidor en Chile y directrices del SERNAC:\n1. Garantía Legal de 6 Meses: Si el producto presenta fallas técnicas de fábrica, tienes derecho irrestricto al cambio por uno nuevo, reparación gratuita o devolución del 100% de tu dinero.\n2. Garantía de Satisfacción de 30 Días: Si el producto no es lo que esperabas, puedes devolverlo sin costo dentro de 30 días, siempre que esté con sus embalajes y accesorios originales.',
    tags: ['garantia', 'devolucion', 'reembolso', 'sernac', 'falla', 'cambio', 'satisfaccion', 'plata']
  },
  {
    id: 'dev-procedimiento',
    category: 'devoluciones',
    question: '¿Cómo solicito un cambio o reembolso si el producto llegó dañado?',
    shortAnswer: 'Envíanos un video o foto breve del defecto a soporte y te generamos una etiqueta de retorno prepagada.',
    detailedAnswer: 'Pasos para tramitar tu garantía:\n1. Escribe a nuestro soporte indicando tu N° de orden y adjunta una foto/video del desperfecto.\n2. Nuestro equipo emite una orden de flete prepagado por Chilexpress o Starken para que dejes el paquete en cualquier sucursal sin costo.\n3. Una vez recibido e inspeccionado en bodega (48h), te enviamos la reposición express o retransferimos el 100% del dinero a tu cuenta bancaria.',
    tags: ['dañado', 'roto', 'defectuoso', 'como devolver', 'procedimiento', 'pasos', 'reembolsar']
  },

  // 4. MEDIOS DE PAGO (PAYMENT OPTIONS)
  {
    id: 'pago-medios',
    category: 'pagos',
    question: '¿Qué métodos y medios de pago están disponibles?',
    shortAnswer: 'Webpay Plus (Redcompra y Tarjetas de Crédito en cuotas), Mercado Pago, CuentaRUT, Mach y Tenpo.',
    detailedAnswer: 'Aceptamos los principales medios de pago en pesos chilenos (CLP):\n• Webpay Plus de Transbank: Tarjetas de Débito Redcompra (incluye CuentaRUT de BancoEstado) y Tarjetas de Crédito Visa, Mastercard, Magna y Amex con opción de 3 a 12 cuotas.\n• Mercado Pago: Pago con saldo en cuenta, tarjetas bancarias y transferencias inmediatas.\n• Billeteras Digitales: Mach, Tenpo y Copec Pay.\nTodas las transacciones están encriptadas con protocolo SSL bancario de 256 bits.',
    tags: ['pago', 'medios de pago', 'webpay', 'transbank', 'redcompra', 'cuentarut', 'mercado pago', 'tarjeta', 'cuotas']
  },
  {
    id: 'pago-factura',
    category: 'pagos',
    question: '¿Emiten boleta o factura con IVA desglosado para empresas?',
    shortAnswer: 'Sí, emitimos Boleta Electrónica (DTE 39) automática con 19% IVA o Factura (DTE 33) si ingresas tu RUT empresa.',
    detailedAnswer: 'En cumplimiento con la Ley N° 21.713 y normativa del SII, todos los precios mostrados incluyen el 19% de IVA. Si compras como persona natural te llegará la Boleta Electrónica a tu correo. Si necesitas Factura para tu empresa (deducción de crédito fiscal), puedes marcar la casilla "Necesito Factura" en el checkout e ingresar el RUT y razón social de tu empresa.',
    tags: ['boleta', 'factura', 'iva', 'sii', 'dte', 'rut', 'empresa', 'impuesto']
  },

  // 5. COMPLIANCE TRIBUTARIO Y ADUANAS (LEY N° 21.713 - SII)
  {
    id: 'sii-codigos',
    category: 'compliance',
    question: '¿Cuáles son los códigos de actividad económica del SII para vender por internet?',
    shortAnswer: 'El código obligatorio es 479100 ("Venta al por menor por internet"). Recomendado 469000 para ventas mayoristas B2B.',
    detailedAnswer: 'Para formalizar una tienda online en Chile ante el SII:\n• Código 479100: "Venta al por menor por correo, por internet y vía telefónica" (1ra Categoría, afecto a IVA 19%). Es el código principal obligatorio para Shopify, WooCommerce o Mercado Libre.\n• Código 469000: "Venta al por mayor no especializada" (1ra Categoría, afecto a IVA 19%). Indispensable si planeas vender packs por mayor a empresas o distribuidores locales.\nRégimen recomendado: Pro-Pyme General (14 D3) o Transparente (14 D8).',
    tags: ['codigo sii', 'giro', 'actividad economica', '479100', '469000', 'formalizacion', 'empresa', 'spa', 'primera categoria']
  },
  {
    id: 'aduanas-500usd',
    category: 'compliance',
    question: '¿Cuándo se necesita un Agente de Aduanas y cómo opera el umbral de USD 500?',
    shortAnswer: 'Hasta US$ 500 CIF opera courier simplificado (arancel 0% + 19% IVA). Sobre US$ 500 CIF es OBLIGATORIO Agente de Aduanas matriculado y DIN formal.',
    detailedAnswer: 'Bajo la Ordenanza de Aduanas de Chile y la Ley N° 21.713:\n• Envíos hasta US$ 500 CIF (Courier Express): El courier (DHL, FedEx, Correos de Chile) hace el despacho rápido. Paga 0% Arancel pero 19% IVA OBLIGATORIO sin excepción.\n• Envíos sobre US$ 500 CIF: La ley exige contratar obligatoriamente un Agente de Aduana matriculado para tramitar la Declaración de Ingreso (DIN). Se aplica arancel general del 6% Ad-Valorem + 19% IVA sobre el valor CIF + Arancel.',
    tags: ['agente de aduanas', '500 dolares', 'us$ 500', 'din', 'courier', 'internacion', 'arancel', 'declaracion de ingreso']
  },
  {
    id: 'f29-recuperar-iva',
    category: 'compliance',
    question: '¿Cómo recupero el IVA pagado en aduanas como Crédito Fiscal en el Formulario 29 (F29)?',
    shortAnswer: 'Pide al courier o agente de aduanas consignar el RUT de tu SpA. Aparecerá en el RCV del SII como Crédito Fiscal para descontar del Débito.',
    detailedAnswer: 'Mecanismo de Acreditación de Crédito Fiscal en Chile:\n1. Al importar vía courier o con Agente de Aduanas, exige que el importador sea el RUT de tu Empresa (SpA) y no tu RUT personal.\n2. El IVA del 19% pagado en la DIN o liquidación aduanera se carga automáticamente en tu Registro de Compras y Ventas (RCV) del SII.\n3. En el F29 mensual, este IVA Crédito se descuenta peso por peso del IVA Débito (el 19% cobrado a tus clientes por boletas). Si importas como persona natural, ese 19% se pierde como costo irrecuperable.',
    tags: ['f29', 'credito fiscal', 'debito fiscal', 'recuperar iva', 'rcv', 'registro compras', 'sii', 'formulario 29', 'impuesto']
  },
  {
    id: 'ley-21713-citaciones',
    category: 'compliance',
    question: '¿Qué hacer si recibo una citación del SII por transferencias o Ley N° 21.713?',
    shortAnswer: 'Regulariza de inmediato con SpA en "Tu Empresa en un Día", formaliza inicio de actividades y respalda invoices de compra internacional.',
    detailedAnswer: 'La Ley N° 21.713 faculta al SII a fiscalizar a quienes reciban más de 50 transferencias mensuales o abonos recurrentes sin inicio de actividades.\nPasos de defensa:\n1. No ignores la notificación del SII: Tienes plazo legal perentorio para responder.\n2. Formaliza de inmediato tu SpA en tuempresaenundia.cl y declara Inicio de Actividades en 1ra Categoría (código 479100).\n3. Reúne comprobantes de pago a proveedores (invoices de AliExpress/Dropi, guías de despacho, cartolas bancarias) para justificar que el dinero recibido corresponde a ventas con costos asociados y no a 100% de utilidad líquida no declarada.',
    tags: ['citacion sii', 'ley 21713', '50 transferencias', 'fiscalizacion', 'notificacion', 'defensa', 'multa', 'cuenta rut']
  },

  // 6. LOGÍSTICA, FULFILLMENT & COURIERS CHILE 2026
  {
    id: 'logistica-couriers-comparativa',
    category: 'logistica',
    question: '¿Qué courier conviene elegir en Chile entre Starken, Blue Express, Chilexpress y Chazki?',
    shortAnswer: 'Blue Express es líder en e-commerce con +2.000 Lockers PUDO; Starken lidera en paquetes pesados y regiones; Chilexpress en SLA prioritario día siguiente; y Chazki en Same-Day RM.',
    detailedAnswer: 'Guía de selección de Couriers Chile 2026:\n• Blue Express: Tarifa base ~$2.990 CLP, red de +2.000 casilleros inteligentes PUDO 24/7 (ahorro de ~18% y casi cero fallas de entrega). Ideal para moda, gadgets y mascotas.\n• Starken: 400+ sucursales, descuento por retiro en agencia, fuerte en provincias y paquetes voluminosos (> 3 kg). Tarifa base ~$3.200 CLP.\n• Chilexpress: Máxima puntualidad (SLA 98.4% de cumplimiento) con entrega matutina garantizada (Priority) y cobertura en zonas extremas. Tarifa base ~$3.600 CLP.\n• Chazki / 99Minutos: Envíos Same-Day en RM urbana para compras antes de las 13:00 hrs. Aumenta la conversión en Santiago +35%.',
    tags: ['courier', 'starken', 'blue express', 'chilexpress', 'chazki', '99minutos', 'tarifas', 'despacho', 'envio']
  },
  {
    id: 'logistica-peso-volumetrico',
    category: 'logistica',
    question: '¿Cómo se calcula el peso volumétrico en los couriers de Chile?',
    shortAnswer: 'Fórmula estándar: (Largo cm x Ancho cm x Alto cm) / 4.000. El courier factura el valor mayor entre el peso real y el volumétrico.',
    detailedAnswer: 'El estándar de la industria logística chilena (Starken, Blue Express, Chilexpress) utiliza un factor de 4.000 cm³/kg:\nPeso Volumétrico (kg) = (Largo x Ancho x Alto) / 4000.\nEjemplo: Una caja de 30x25x20 cm tiene un volumen de 15.000 cm³. Su peso volumétrico es 15.000 / 4.000 = 3.75 kg. Aunque el producto pese físicamente 0.5 kg, el courier te cobrará por 3.75 kg (tramo de 4 kg). Recomendación: Ajusta el tamaño de tus cajas kraft para no pagar fletes inflados.',
    tags: ['peso volumetrico', 'formula', '4000', 'cubicaje', 'dimensiones', 'caja', 'kilos facturables']
  },
  {
    id: 'logistica-3pl-vs-propio',
    category: 'logistica',
    question: '¿Cuándo conviene migrar a un Centro de Fulfillment 3PL en vez de armar pedidos propios?',
    shortAnswer: 'Bajo 350 pedidos/mes conviene bodega propia o taller. Sobre 350-500 pedidos/mes un 3PL ahorra costos fijos de arriendo y personal.',
    detailedAnswer: 'Regla de escala en e-commerce chileno:\n• < 350 pedidos/mes (In-House): Mantén los costos fijos en $0 operando desde tu oficina/taller o garage. No pagues arriendos comerciales de bodega.\n• > 350 - 500 pedidos/mes (3PL): Tercerizar con Shipit, Blue Fulfillment o Ecomsur elimina los costos fijos de bodega ($380.000+) y contratos laborales ($550.000+). El 3PL cobra almacenamiento por pallet (~$28.000/mes) + Pick & Pack por pedido (~$990) y accede a fletes corporativos con 10-15% de descuento por volumen.',
    tags: ['3pl', 'fulfillment', 'in house', 'propio', 'bodega', 'shipit', 'blue fulfillment', 'pick and pack']
  },
  {
    id: 'logistica-envio-gratis-estrategia',
    category: 'logistica',
    question: '¿Es mejor cobrar el flete real en checkout o dar Envío Gratis sobre un ticket mínimo?',
    shortAnswer: 'Envío Gratis sobre $29.990 CLP con subsidio de $2.990 en el margen bruto. Cobrar $3.800+ en checkout genera > 55% de abandono de carrito.',
    detailedAnswer: 'Estrategia de conversión probada en Chile 2026:\n1. Cobrar el flete real de $3.800 a $4.500 al final del checkout causa que más del 55% de los compradores chilenos abandonen la compra.\n2. La estrategia óptima es ofrecer "Envío Gratis a todo Chile por compras sobre $29.990 CLP".\n3. Para que sea rentable, diseña ofertas de packs x2 o agrega un producto complementario (cross-sell) de $7.990. El margen incremental absorberá holgadamente los $2.990 del costo de despacho.',
    tags: ['envio gratis', 'ticket minimo', 'flete', 'conversion', 'abandono carrito', '29990', 'promocion']
  },

  // 7. AUDITORÍA GLOBAL DE NEGOCIOS & CAPITAL DE TRABAJO (2026)
  {
    id: 'auditoria-viabilidad-markup',
    category: 'auditoria',
    question: '¿Cuál es el margen y markup mínimo para que una tienda e-commerce sea viable en Chile?',
    shortAnswer: 'Markup mínimo de 2.8x a 3.2x sobre el Costo Landed y Margen Neto final post-Ads superior al 18%-22%.',
    detailedAnswer: 'Parámetros de viabilidad del Blueprint 2026:\n• Markup Saludable: El PVP debe ser al menos 2.8x a 3.2x el costo landed (Proveedor + Flete + 19% IVA). Ejemplo: Si tu producto importado puesto en Chile cuesta $10.000 CLP, tu PVP debe ser mínimo $28.000 - $32.000 CLP.\n• Absorción de Costos: Ese margen bruto del ~65%-70% debe cubrir: Comisión de pasarela Webpay (2.8%-3.8%), CAC de Ads ($3.800 - $4.500 CLP), flete subsidiado ($2.990 CLP) y reserva SERNAC de 3%.\n• Margen Neto Objetivo: Debe quedar al menos un 18% a 25% de utilidad líquida en tu cuenta corriente.',
    tags: ['viabilidad', 'markup', 'margen neto', 'rentabilidad', 'breakeven', 'costo landed', 'pvp']
  },
  {
    id: 'auditoria-capital-trabajo-flujo',
    category: 'auditoria',
    question: '¿Cómo optimizar el capital de trabajo y el ciclo de caja entre pasarelas y proveedores?',
    shortAnswer: 'Usa Webpay Plus con liquidación D+1 para abonar tu cuenta bancaria en 24h y pagar a proveedores con tarjeta de crédito corporativa a 30 días.',
    detailedAnswer: 'Estrategia de Optimización de Caja (Cash Flow Mastery):\n1. Liquidación Acelerada de Pasarela: Webpay Plus Transbank liquida en tu cuenta bancaria en 24 a 48 horas hábiles (D+1 débito, D+2 crédito). Evita planes estándar de Mercado Pago que retienen el dinero 14 a 30 días.\n2. Ciclo de Proveedor: Paga las compras de reposición en AliExpress/CJ con tarjeta de crédito bancaria empresarial (dando hasta 30-45 días de crédito sin interés).\n3. Retención de IVA en F29: El IVA que pagas al importar en aduana es Crédito Fiscal. No gastes el IVA Débito que cobras en tus ventas; resérvalo para compensarlo contra el crédito el día 20 del mes en tu declaración F29.',
    tags: ['capital de trabajo', 'ciclo de caja', 'flujo de caja', 'webpay', 'transbank', 'liquidacion', 'proveedor']
  },

  // 8. QA AUTOMATIZADO, TESTING Y CI/CD (2026)
  {
    id: 'qa-pruebas-unitarias-exactitud',
    category: 'auditoria',
    question: '¿Cómo garantiza el Blueprint que los cálculos de impuestos y rentabilidad son 100% exactos?',
    shortAnswer: 'A través de una suite de 7 pruebas unitarias automatizadas con Vitest que validan Base CIF, Ley 21.713, Arancel 6%, IVA 19% y Margen Neto >= 20%.',
    detailedAnswer: 'El motor financiero cuenta con 7 pruebas unitarias automatizadas ejecutadas con Vitest en menos de 10ms. Validan que: 1) La base CIF sume FOB + Flete; 2) La conversión a USD/CLP use la tasa fijada de $940; 3) Se aplique el 6% de arancel en régimen general; 4) Se tribute el 19% de IVA eliminando la exención de US$ 41; 5) El precio sugerido garantice un margen neto mínimo del 20% tras deducir CAC y pasarelas (~3.51%). El pipeline rechaza cualquier build si una prueba falla.',
    tags: ['qa', 'pruebas unitarias', 'vitest', 'testing', 'exactitud', 'impuestos', 'ley 21713', 'cif', 'margen neto']
  },
  {
    id: 'qa-cicd-pipeline-playwright',
    category: 'auditoria',
    question: '¿Qué pruebas End-to-End (E2E) y pipeline CI/CD tiene el Blueprint?',
    shortAnswer: 'Utiliza Playwright para pruebas multi-navegador (Chromium, Firefox, WebKit) y GitHub Actions para impedir despliegues con errores.',
    detailedAnswer: 'La suite E2E de Playwright simula el comportamiento real de usuarios a través de las pestañas: verifica la navegación fluida, la reactividad entre la selección de nichos y el Dashboard Ejecutivo, la persistencia del estado en AppContext y la generación segura de PDFs y JSONs técnicos sin errores en consola. En GitHub Actions (.github/workflows/deploy.yml), el paso "npm run test:unit" actúa como gatekeeper obligatorio antes de compilar y empaquetar el contenedor Docker.',
    tags: ['playwright', 'e2e', 'cicd', 'github actions', 'pipeline', 'multinavegador', 'chromium', 'firefox', 'webkit']
  },
  {
    id: 'qa-resiliencia-cuota-gemini-429',
    category: 'auditoria',
    question: '¿Cómo resuelve la plataforma los límites de cuota (error 429) y garantiza alta disponibilidad?',
    shortAnswer: 'Implementa Circuit Breaker con enfriamiento de 15 min, caché en memoria de 20 min y fallback automático a base legal preverificada.',
    detailedAnswer: 'Para evitar saturación de la API de Gemini y cobros imprevistos por cuota excedida (429 RESOURCE_EXHAUSTED), el sistema incorpora 4 capas de resiliencia: 1) Caché in-memory con TTL de 20 minutos; 2) Circuit Breaker que detecta el error 429 y suspende llamadas externas por 15 minutos; 3) Modo bajo demanda para Google Search grounding (evita llamadas duplicadas en el montaje); 4) Fallback transparente a la base de datos regulatoria chilena (Ley 21.713, SII y SERNAC).',
    tags: ['cuota gemini', 'error 429', 'resiliencia', 'circuit breaker', 'cache', 'resource exhausted', 'alta disponibilidad', 'fallback']
  }
];

// Complex queries patterns that should prompt human escalation
export const COMPLEX_ESCALATION_KEYWORDS = [
  'humano',
  'persona',
  'agente',
  'ejecutivo',
  'operador',
  'hablar con alguien',
  'demanda',
  'abogado',
  'sernac denuncia',
  'estafa',
  'no me llega hace 40 dias',
  'perdido',
  'robado',
  'abrir ticket',
  'reclamo grave',
  'hablar con soporte',
  'quiero que me llame',
  'insatisfecho',
  'problema complejo'
];

export function findMatchingFAQ(query: string): FAQItem | null {
  const normalized = query.toLowerCase().trim();
  
  // Score matches
  let bestItem: FAQItem | null = null;
  let highestScore = 0;

  for (const faq of STORE_FAQS) {
    let score = 0;
    // Check tags
    for (const tag of faq.tags) {
      if (normalized.includes(tag)) {
        score += 3;
      }
    }
    // Check in question
    const qWords = faq.question.toLowerCase().split(' ');
    for (const w of qWords) {
      if (w.length > 3 && normalized.includes(w)) {
        score += 2;
      }
    }
    // Check in short answer
    const aWords = faq.shortAnswer.toLowerCase().split(' ');
    for (const w of aWords) {
      if (w.length > 4 && normalized.includes(w)) {
        score += 1;
      }
    }

    if (score > highestScore && score >= 3) {
      highestScore = score;
      bestItem = faq;
    }
  }

  return bestItem;
}

export function shouldTriggerEscalation(query: string): boolean {
  const normalized = query.toLowerCase();
  return COMPLEX_ESCALATION_KEYWORDS.some(kw => normalized.includes(kw));
}

// Simulated mock orders for tracking tests
export const MOCK_TRACKING_DATABASE: Record<string, { orderId: string; status: string; carrier: string; eta: string; location: string }> = {
  'CL-8812': {
    orderId: '#CL-8812',
    status: 'En tránsito hacia Chile (Vuelo internacional)',
    carrier: 'Correos de Chile / DSers Priority',
    eta: '6 a 9 días hábiles restantes',
    location: 'Centro de Distribución Internacional Aeropuerto Pudahuel'
  },
  'CL-2026': {
    orderId: '#CL-2026',
    status: 'En reparto a domicilio',
    carrier: 'Chilexpress Express',
    eta: 'Hoy antes de las 19:00 hrs',
    location: 'Camión de reparto en ruta - Providencia, Santiago'
  },
  'CL-9941': {
    orderId: '#CL-9941',
    status: 'Despachado desde bodega local',
    carrier: 'Blue Express',
    eta: '24 a 48 horas hábiles',
    location: 'Hub Logístico Enea, Pudahuel'
  }
};
