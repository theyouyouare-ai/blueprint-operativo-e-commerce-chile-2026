import { AuditItem, NicheModel, PaymentGateway, SprintDayItem, UgcScriptTemplate } from '../types/blueprint';

export const AUDIT_ITEMS: AuditItem[] = [
  {
    id: 1,
    category: 'Pasarelas',
    originalAssumption: 'Shopify + Stripe / pasarela integrada de 1 clic',
    situation2026: 'Shopify Payments NO opera en Chile. Toda tienda chilena necesita pasarela externa conectada por API/App (Webpay Plus, Mercado Pago o Flow).',
    impact: 'Comisión adicional de pasarela externa (0,5% - 2% extra si usas Shopify sin pasarela nativa), más potencial fricción de redirección en checkout.',
    actionableFix: 'Implementar Webpay Plus (Transbank) como pasarela primaria (1,75% débito / 2,35% crédito) + Mercado Pago como respaldo transparente ante caídas.',
    severity: 'critical'
  },
  {
    id: 2,
    category: 'Canales',
    originalAssumption: 'TikTok Shop como canal de venta con checkout nativo integrado',
    situation2026: 'TikTok Shop aún no opera formalmente con checkout nativo en Chile (operación directa en el país desde Q4-2025 y registro de vendedores global abierto, lanzamiento estimado Q3-Q4 2026).',
    impact: 'TikTok no se puede usar hoy como marketplace con checkout in-app en Chile. Se usa exclusivamente como canal de adquisición de tráfico pagado hacia la tienda web.',
    actionableFix: 'Registrar la cuenta de vendedor en la versión global de TikTok Shop para reserva temprana, pero dirigir el 100% del tráfico de TikTok Ads a la tienda Shopify/WooCommerce.',
    severity: 'high'
  },
  {
    id: 3,
    category: 'Algoritmos Meta',
    originalAssumption: 'Meta Ads: 1 campaña → 3 conjuntos por intereses específicos',
    situation2026: 'Meta discontinuó gran parte de la segmentación detallada por intereses a inicios de 2026, migrando el ecosistema a Advantage+ Shopping Campaigns (ASC / targeting amplio guiado por IA/Andrómeda).',
    impact: 'La estructura manual de micro-intereses en Meta rinde significativamente menos y encarece el CPM. En cambio, en TikTok Ads la segmentación por interés sí se mantiene vigente.',
    actionableFix: 'En Meta: Usar Advantage+ Shopping broad a nivel país con 5-8 creativos variados. En TikTok Ads: Mantener Grupo 1 (Broad) + Grupo 2 (Interés nicho).',
    severity: 'high'
  },
  {
    id: 4,
    category: 'Impuestos & Aduana',
    originalAssumption: 'Compras internacionales bajo USD 41 exentas de IVA y arancel',
    situation2026: 'Desde octubre 2025 (Ley N°21.713 de Cumplimiento Tributario), esa exención NO existe. Todas las compras internacionales pagan 19% IVA sin importar el monto.',
    impact: 'El costo "landed" de cada unidad importada sube exactamente un 19% frente a lo que calculan las guías antiguas de dropshipping en español.',
    actionableFix: 'Sumar siempre 19% de IVA al subtotal CIF (Proveedor + Flete) en el simulador. Al ser intermediación inscrita ante el SII (AliExpress), no paga arancel del 6% bajo USD 500.',
    severity: 'critical'
  },
  {
    id: 5,
    category: 'Presupuesto Ads',
    originalAssumption: 'Fase de testing inicial en Meta / TikTok con USD 5-10 al día',
    situation2026: 'Con USD 5-10/día, el píxel de Meta NO alcanza las 50 conversiones semanales para salir de la fase de aprendizaje ni el algoritmo ASC junta señal suficiente.',
    impact: 'Presupuestos de testing pulverizados sin optimización algorítmica si se lanzan en Meta.',
    actionableFix: 'Canal primario inicial con USD 5-10/día: TikTok Ads (menor CPM en Chile y targeting broad efectivo). Sumar Meta Ads recién al superar los USD 20/día.',
    severity: 'high'
  }
];

export const NICHES_DATA: NicheModel[] = [
  {
    id: 'mascotas',
    name: 'Mascotas (Pet Wellness)',
    badge: 'Alta Recompra & Fidelidad',
    categoryKey: 'mascotas',
    searchVolumeMonthCL: '62.000 búsquedas/mes',
    competitionLevel: 'Media',
    marketAveragePriceCLP: 34990,
    primaryChannel: 'TikTok Ads',
    whyWorks2026: 'Demanda estructural insustituible y recompra alta. El gasto en bienestar y salud animal en Chile no muestra desaceleración; los dueños tienen baja sensibilidad al precio ante soluciones de cuidado.',
    entryProducts: [
      'Dispensador automático de agua con filtro cerámico',
      'Comedero inteligente programable',
      'Arnés / correa ergonómica manos libres para running',
      'Cama ortopédica lavable anti-ansiedad'
    ],
    supplierCostUSD: 11,
    shippingCostUSD: 5,
    suggestedPvpCLP: 32990,
    demandDrivers: [
      'Humanización de mascotas en hogares urbanos chilenos (departamentos)',
      'Preocupación por hidratación y alimentación durante jornadas de oficina',
      'Disposición a pagar sobreprecio por durabilidad y certificaciones higiénicas'
    ],
    validationChecklist: {
      trendsTerm: 'dispensador agua gato / comedero automatico perros',
      meliCategory: 'Mercado Libre Chile > Animales y Mascotas > Comederos y Bebederos (filtrar por Más Vendidos)',
      competitorIntensity: 'Minea / TrendTrack: 12-25 tiendas activas en LATAM (mercado caliente validado, espacio para mejor oferta)',
      customerPainPointsToSolve: [
        'Filtros que se ensucian rápido (incluir 3 repuestos de regalo en el pack)',
        'Bomba de agua ruidosa (destacar motor ultrasilencioso < 20dB)',
        'Cable mordible (ofrecer protector reforzado antimordeduras)'
      ]
    }
  },
  {
    id: 'belleza',
    name: 'Belleza, Skincare & Bienestar',
    badge: 'Alto LTV & Variantes',
    categoryKey: 'belleza',
    searchVolumeMonthCL: '85.000 búsquedas/mes',
    competitionLevel: 'Media-Alta',
    marketAveragePriceCLP: 27990,
    primaryChannel: 'Meta Ads',
    whyWorks2026: 'Alta tasa de recompra y prueba de variantes periódica (eleva el Lifetime Value - LTV). El alto margen bruto permite invertir de forma más agresiva en adquisición de tráfico pagado.',
    entryProducts: [
      'Dispositivo de fototerapia facial LED (anti-acné / rejuvenecimiento)',
      'Rodillo facial vibratorio / Gua Sha térmico',
      'Cepillo estilizador de aire caliente multifunción',
      'Herramientas ergonómicas de rutina capilar nocturna'
    ],
    supplierCostUSD: 8,
    shippingCostUSD: 4,
    suggestedPvpCLP: 24990,
    demandDrivers: [
      'Tendencia de "skin-care clinic at home" sin costo recurrente de centro estético',
      'Efecto visual inmediato ideal para ganchos (hooks) en videos de TikTok e Instagram',
      'Facilidad de armar bundles con aceites, sueros o cabezales de recambio'
    ],
    validationChecklist: {
      trendsTerm: 'mascara led facial / cepillo secador pelo',
      meliCategory: 'Mercado Libre Chile > Belleza y Cuidado Personal > Cuidado de la Piel',
      competitorIntensity: 'Minea: 30+ anuncios activos corriendo en Chile y Colombia (creatividad UGC es el factor diferenciador)',
      customerPainPointsToSolve: [
        'Instrucciones solo en chino/inglés (incluir guía digital en español en PDF descargable)',
        'Batería dura poco (especificar autonomía real de 10-15 sesiones)',
        'Miedo a quemaduras o irritación (resaltar certificación CE/RoHS y test dermatológico)'
      ]
    }
  },
  {
    id: 'hogar',
    name: 'Hogar & Iluminación LED',
    badge: 'Solución Funcional Inmediata',
    categoryKey: 'hogar',
    searchVolumeMonthCL: '54.000 búsquedas/mes',
    competitionLevel: 'Media',
    marketAveragePriceCLP: 39990,
    primaryChannel: 'Meta Ads',
    whyWorks2026: 'El consumidor chileno busca soluciones concretas para teletrabajo/estudio, smart home económico y optimización de espacios reducidos. Ticket promedio más alto.',
    entryProducts: [
      'Barra de iluminación inteligente RGB para monitor (cuidado ocular)',
      'Lámpara de noche levitante magnética con cargador Qi',
      'Sellador térmico portátil para despensa y alimentos',
      'Tira LED inteligente sincronizada con sonido y app'
    ],
    supplierCostUSD: 12,
    shippingCostUSD: 5,
    suggestedPvpCLP: 36990,
    demandDrivers: [
      'Consolidación del modelo híbrido de trabajo en Santiago y regiones',
      'Deseo de ambientación moderna y estética "desk setup" minimalista',
      'Ahorro de espacio y reducción de desorden visual de cables'
    ],
    validationChecklist: {
      trendsTerm: 'luz monitor escritorio / lampara levitante qi',
      meliCategory: 'Mercado Libre Chile > Iluminación para el Hogar > Lámparas de Mesa y Tiras LED',
      competitorIntensity: 'Minea: 15-20 creativos activos enfocados en "setup upgrade"',
      customerPainPointsToSolve: [
        'Poco brillo o parpadeo (especificar lúmenes reales y filtro anti-flicker)',
        'Enchufe incompatible (garantizar conector chileno Tipo C/L o USB-C universal)',
        'Adhesivos de mala calidad (incluir cinta 3M de alto anclaje)'
      ]
    }
  },
  {
    id: 'tecnologia',
    name: 'Tecnología & Gadgets',
    badge: 'Alto Ticket & Demanda Intencional',
    categoryKey: 'tecnologia',
    searchVolumeMonthCL: '95.000 búsquedas/mes',
    competitionLevel: 'Alta',
    marketAveragePriceCLP: 49990,
    primaryChannel: 'Google Shopping',
    whyWorks2026: 'Gadgets de productividad, audio y accesorios de viaje con búsqueda de alta intención en Google Shopping y YouTube. Ticket promedio superior para maximizar margen neto.',
    entryProducts: [
      'Mini proyector portátil multimedia 1080p nativo con WiFi',
      'Organizador de escritorio modular con triple carga rápida inalámbrica',
      'Trípode inteligente con seguimiento facial AI 360° para creadores',
      'Adaptador multipuerto USB-C 8 en 1 con salida HDMI 4K'
    ],
    supplierCostUSD: 16,
    shippingCostUSD: 6,
    suggestedPvpCLP: 47990,
    demandDrivers: [
      'Auge de creadores de contenido y streaming en TikTok y YouTube en Chile',
      'Necesidad de conectar laptops y periféricos en oficinas híbridas y viajes',
      'Alta disposición a comprar por reviews técnicas fundamentadas'
    ],
    validationChecklist: {
      trendsTerm: 'mini proyector portatil / tripode seguimiento facial',
      meliCategory: 'Mercado Libre Chile > Computación y Audio/Video > Gadgets y Accesorios',
      competitorIntensity: 'Google Shopping / Mercado Libre: 40+ ofertas activas (se compite por garantía local y entrega rápida)',
      customerPainPointsToSolve: [
        'Calidad de audio deficiente (ofrecer conexión Bluetooth para parlante externo)',
        'Compatibilidad con iOS/Android (manual detallado paso a paso en español)',
        'Garantía de 6 meses por Ley SERNAC no respetada por vendedores informales'
      ]
    }
  }
];

export const PAYMENT_GATEWAYS: PaymentGateway[] = [
  {
    id: 'webpay_plus',
    name: 'Webpay Plus (Transbank)',
    category: 'Pasarela Principal',
    commission: 'Crédito: 2,35% / Débito y Prepago: 1,75% + IVA',
    settlementTime: '24 a 48 horas hábiles',
    whenToUse: 'Pasarela número 1 obligatoria. Mayor penetración, menor comisión a volumen y máxima confianza para el comprador chileno tradicional.',
    pros: [
      'Comisión más baja del mercado local chileno',
      'Confianza absoluta del consumidor con Redcompra y bancos chilenos',
      'Liquidación rápida a tu cuenta corriente bancaria de empresa'
    ],
    cons: [
      'Checkout con redirección hacia Webpay',
      'Onboarding requiere formalización previa en SII y cuenta bancaria de empresa',
      'Soporte técnico y portal a veces lento en incidentes'
    ],
    reliabilityScore: 92
  },
  {
    id: 'mercado_pago',
    name: 'Mercado Pago',
    category: 'Pasarela de Respaldo & Cuotas',
    commission: '~2,99% - 3,19% + IVA (según plazo de acreditación)',
    settlementTime: 'Instantánea / 24 horas',
    whenToUse: 'Respaldo inmediato si Webpay presenta intermitencias. Excelente para clientes que prefieren pagar con saldo en cuenta Mercado Pago o cuotas sin interés.',
    pros: [
      'Onboarding digital expedito en menos de 24 horas',
      'Ofrece cuotas automáticas y pago con dinero en cuenta MP',
      'Excelente API y estabilidad de uptime'
    ],
    cons: [
      'Comisión porcentual superior a Webpay Plus',
      'Retenciones transitorias ante reclamos no resueltos'
    ],
    reliabilityScore: 95
  },
  {
    id: 'flow',
    name: 'Flow.cl',
    category: 'Alternativa Multimedios',
    commission: '~2,89% - 3,19% + IVA (según medio de pago elegido)',
    settlementTime: 'Según plazo pactado (1 a 3 días hábiles)',
    whenToUse: 'Alternativa "todo en uno" si buscas una sola integración que consolide tarjetas, Servipag, Mach y transferencias bancarias directas.',
    pros: [
      'Integra múltiples pasarelas en un solo contrato',
      'Plugin oficial muy probado para WooCommerce y Shopify',
      'Soporte local en español ágil'
    ],
    cons: [
      'Cobra comisión levemente más alta que Transbank directo',
      'El cliente pasa por la pantalla intermedia de Flow'
    ],
    reliabilityScore: 88
  }
];

export const UGC_SCRIPTS: UgcScriptTemplate[] = [
  {
    id: 'problema_solucion',
    angle: 'Ángulo 1 — Problema / Solución Directa',
    timing: '15 - 20 Segundos',
    targetObjective: 'Detener el scroll rápido (Hook) atacando una frustración cotidiana y mostrar el alivio tangible.',
    structure: [
      {
        phase: 'Hook',
        timeSeconds: '0 - 3s',
        objective: 'Llamar la atención a cámara mencionando el problema puntual e incómodo.',
        scriptPrompt: '"Si tienes un [mascota / piel con brotes / escritorio lleno de cables], por favor NO compres esto hasta que veas por qué cambió todo..."',
        visualAction: 'Primer plano a cámara con expresión de sorpresa o molestia real, mostrando el problema visualmente (ej. gato tirando el plato de agua).'
      },
      {
        phase: 'Desarrollo',
        timeSeconds: '3 - 12s',
        objective: 'Demostrar el producto en acción con un solo beneficio concreto (idealmente comparación antes/después).',
        scriptPrompt: '"Este [nombre producto] tiene [característica única]. En solo 2 días logré [resultado tangible]. Miren la diferencia de cómo funciona aquí..."',
        visualAction: 'Toma B-roll vertical nítida de las manos operando el producto en tiempo real, sin música genérica, sonido ASMR del producto operando.'
      },
      {
        phase: 'CTA & Confianza',
        timeSeconds: '12 - 18s',
        objective: 'Llamado a la acción claro con garantía y plazo de despacho en Chile.',
        scriptPrompt: '"Llega a todo Chile con seguimiento en línea y garantía de 30 días. Haz clic abajo en el botón para ver si aún quedan con stock disponible."',
        visualAction: 'Muestra de la caja llegando o pantalla de la tienda con logo de Webpay y botón "Comprar ahora".'
      }
    ]
  },
  {
    id: 'unboxing_reaccion',
    angle: 'Ángulo 2 — Unboxing & Primera Reacción Real',
    timing: '20 - 25 Segundos',
    targetObjective: 'Construir confianza de recepción de paquete y disipar temores de estafa o producto roto.',
    structure: [
      {
        phase: 'Hook',
        timeSeconds: '0 - 3s',
        objective: 'Reacción genuina al cortar la bolsa de envío que acaba de llegar por encomienda.',
        scriptPrompt: '"Me acaba de llegar el paquete que vi por todos lados en TikTok y necesitaba probar si de verdad valía los [CLP $XX.XXX]..."',
        visualAction: 'Tijeras abriendo el paquete de correo en un mesón de cocina o escritorio, mostrando la etiqueta de envío.'
      },
      {
        phase: 'Desarrollo',
        timeSeconds: '3 - 15s',
        objective: 'Unboxing rápido, prueba de tacto y encendido inmediato para demostrar que funciona.',
        scriptPrompt: '"La calidad de los materiales se siente súper sólida, nada que ver con plásticos baratos. Miren lo fácil que se conecta y cómo empieza a funcionar al segundo..."',
        visualAction: 'Cámara en mano, tomas cercanas a los botones, luces o acabados del producto. Reacción genuina de agrado.'
      },
      {
        phase: 'CTA & Oferta',
        timeSeconds: '15 - 22s',
        objective: 'Oferta temporal honesta y enlace visible.',
        scriptPrompt: '"Tienen despacho a todo Chile y pagué directo con Redcompra. Te dejo el enlace abajo con la promo activa para este mes."',
        visualAction: 'Texto en pantalla: "Despacho a todo Chile 🇨🇱 | Pago seguro Webpay" con flecha indicando el enlace.'
      }
    ]
  }
];

export const SPRINT_7_DAYS: SprintDayItem[] = [
  {
    day: 1,
    title: 'Selección de Nicho & Validación Cuantitativa',
    subtitle: 'Elige 1 solo nicho para el primer sprint (no los tres en paralelo)',
    timeEst: '3 - 4 Horas',
    tasks: [
      {
        id: 'd1_t1',
        text: 'Elegir 1 nicho prioritario (Mascotas, Belleza o Tech)',
        detail: 'Enfocarse en 1 solo nicho reduce drásticamente la dispersión de creativos y permite que el píxel concentre data.'
      },
      {
        id: 'd1_t2',
        text: 'Validar volumen en Google Trends y "Más Vendidos" de Mercado Libre Chile',
        detail: 'Comprobar que existan al menos 500+ búsquedas mensuales e interés sostenido en Chile.'
      },
      {
        id: 'd1_t3',
        text: 'Auditar intensidad publicitaria en Minea / AdSpy',
        detail: 'Confirmar que hay al menos 5-10 anuncios corriendo del concepto (prueba de que hay mercado y flujo de compra).'
      },
      {
        id: 'd1_t4',
        text: 'Extraer defectos de reseñas de 1-3 estrellas en AliExpress/Amazon',
        detail: 'Anotar las 3 quejas principales para convertirlas en ventajas competitivas en el copy de la landing.'
      }
    ]
  },
  {
    day: 2,
    title: 'Formalización Legal & Tributaria SII',
    subtitle: 'Obligatorio antes de la primera venta para no operar en la informalidad',
    timeEst: '2 - 3 Horas',
    tasks: [
      {
        id: 'd2_t1',
        text: 'Inicio de Actividades en sii.cl como SpA o Persona Natural con Giro',
        detail: 'Giro: "Venta al por menor de productos n.c.p. por internet / Comercio electrónico minorista". Evita multas de hasta 30% del impuesto eludido.'
      },
      {
        id: 'd2_t2',
        text: 'Inscribirse en Régimen Pro Pyme General (Art. 14 D N°3)',
        detail: 'Tasa reducida de Impuesto de Primera Categoría del 12,5% vigente para el ejercicio 2026.'
      },
      {
        id: 'd2_t3',
        text: 'Adquirir Certificado Digital tributario y habilitar Boleta Electrónica (DTE 39)',
        detail: 'Para emitir boletas a consumidor final automáticamente tras cada compra.'
      }
    ]
  },
  {
    day: 3,
    title: 'Creación de Tienda & Conexión con Proveedor',
    subtitle: 'Shopify Basic + DSers con catálogo curado',
    timeEst: '4 - 5 Horas',
    tasks: [
      {
        id: 'd3_t1',
        text: 'Crear tienda en Shopify Basic configurada en moneda CLP ($)',
        detail: 'Establecer formato de precios limpios terminados en $990 (ej. $24.990, $32.990).'
      },
      {
        id: 'd3_t2',
        text: 'Instalar aplicación oficial DSers vinculada a AliExpress',
        detail: 'Partner oficial para sincronización de órdenes y números de tracking automáticos.'
      },
      {
        id: 'd3_t3',
        text: 'Importar de 8 a 10 SKU complementarios del nicho elegido',
        detail: '1 producto estrella principal (hero) y 7-9 variantes o upsells para elevar el ticket promedio.'
      },
      {
        id: 'd3_t4',
        text: 'Comprar y vincular dominio propio .cl o .com',
        detail: 'Un dominio con nombre limpio y sin marcas registradas aumenta la tasa de conversión en más de un 35%.'
      }
    ]
  },
  {
    day: 4,
    title: 'Integración de Pasarelas de Pago & Boleta SII',
    subtitle: 'Webpay Plus + Mercado Pago + Conector de DTEs',
    timeEst: '3 - 4 Horas',
    tasks: [
      {
        id: 'd4_t1',
        text: 'Contratar e integrar Webpay Plus (Transbank)',
        detail: 'Configurar tarifa comercial (1,75% débito / 2,35% crédito). Será tu pasarela principal con menor costo a volumen.'
      },
      {
        id: 'd4_t2',
        text: 'Integrar Mercado Pago como pasarela secundaria de respaldo',
        detail: 'Habilita pagos en cuotas y evita perder ventas cuando Transbank presente intermitencias bancarias.'
      },
      {
        id: 'd4_t3',
        text: 'Conectar emisor de boletas electrónicas DTE ante el SII (Bsale, OpenFactura o Haulmer)',
        detail: 'Permite generar y enviar automáticamente la boleta electrónica por email al cliente al pagar.'
      }
    ]
  },
  {
    day: 5,
    title: 'Diseño de Landing Page con Estándar SERNAC',
    subtitle: 'Ficha de producto optimizada para conversión y transparencia',
    timeEst: '4 - 5 Horas',
    tasks: [
      {
        id: 'd5_t1',
        text: 'Estructurar bloque superior (Above the fold): Propuesta de valor + Video/GIF en uso',
        detail: 'Mostrar el producto funcionando en los primeros 3 segundos sin obligar al usuario a hacer scroll.'
      },
      {
        id: 'd5_t2',
        text: 'Cargar 10 a 15 reseñas con fotos reales importadas',
        detail: 'Prueba social indispensable antes de encender cualquier centavo de tráfico pagado.'
      },
      {
        id: 'd5_t3',
        text: 'Redactar política de despacho transparente (15-25 días AliExpress o 24-72h Dropi local)',
        detail: 'Previene cancelaciones y reclamos. El cliente chileno tolera la espera si se le informa honestamente desde el inicio.'
      },
      {
        id: 'd5_t4',
        text: 'Auditoría SERNAC: Eliminar contadores de cuenta regresiva artificiales',
        detail: 'Cumplir con normativa chilena de publicidad verídica. Destacar política de garantía de 30 días.'
      },
      {
        id: 'd5_t5',
        text: 'Checkout simplificado en 3 pasos con sellos visibles de Webpay y Redcompra',
        detail: 'Reduce el abandono de carrito hasta en un 28% al otorgar familiaridad bancaria local.'
      }
    ]
  },
  {
    day: 6,
    title: 'Setup Técnico de Píxeles & Conversions API (CAPI)',
    subtitle: 'Medición robusta sin depender solo de cookies de navegador',
    timeEst: '3 - 4 Horas',
    tasks: [
      {
        id: 'd6_t1',
        text: 'Crear cuentas en TikTok Ads Manager y Meta Business Manager',
        detail: 'Configurar métodos de pago corporativos y zona horaria Chile (America/Santiago).'
      },
      {
        id: 'd6_t2',
        text: 'Instalar TikTok Pixel oficial y verificar eventos en vivo',
        detail: 'Verificar disparo correcto de ViewContent, AddToCart, InitiateCheckout y CompletePayment.'
      },
      {
        id: 'd6_t3',
        text: 'Instalar Meta Pixel + Conversions API (CAPI server-side)',
        detail: 'Vital para mitigar pérdida de datos por iOS y bloqueadores de cookies.'
      },
      {
        id: 'd6_t4',
        text: 'Verificar el dominio en Meta Business Manager y activar Advanced Matching',
        detail: 'Requisito técnico para máxima atribución algorítmica.'
      },
      {
        id: 'd6_t5',
        text: 'Grabar o ensamblar 3 a 5 creativos UGC verticales según guiones',
        detail: 'Tener listos 2 videos Ángulo Problema/Solución y 2 videos Ángulo Unboxing.'
      }
    ]
  },
  {
    day: 7,
    title: 'Lanzamiento de Campaña en TikTok Ads',
    subtitle: 'Foco Broad con presupuesto real (USD 5-10/día)',
    timeEst: '2 - 3 Horas',
    tasks: [
      {
        id: 'd7_t1',
        text: 'Crear campaña de conversión con objetivo "CompletePayment"',
        detail: 'Nunca optimizar para clics o tráfico; el algoritmo busca compradores reales.'
      },
      {
        id: 'd7_t2',
        text: 'Configurar Grupo 1 (Broad): Todo Chile, sin filtro de intereses manuales',
        detail: 'Con presupuesto de USD 5-10/día, concentrar el 100% del gasto en Broad para no diluir señal.'
      },
      {
        id: 'd7_t3',
        text: 'Subir los 3-4 creativos UGC preparados en el Día 6',
        detail: 'El propio contenido y el gancho (hook) hacen la segmentación del cliente ideal.'
      },
      {
        id: 'd7_t4',
        text: 'Registrar la cuenta en la versión global de TikTok Shop (preventivo)',
        detail: 'Quedar pre-aprobado para el momento en que se habilite el checkout nativo en Chile (Q3-Q4 2026).'
      },
      {
        id: 'd7_t5',
        text: 'Monitorear métricas cada 24h: CTR > 1,5%, CPC < USD 0,25, ROAS breakeven ≈ 2,2x',
        detail: 'Mantener la prueba durante 3-4 días antes de apagar creativos de bajo rendimiento.'
      }
    ]
  }
];
