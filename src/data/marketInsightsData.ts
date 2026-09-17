import { MarketNewsItem, ComplianceMilestone, GroundingSource } from '../types/marketInsights';

export const OFFICIAL_REGULATORY_SOURCES: GroundingSource[] = [
  {
    title: 'Servicio Nacional de Aduanas de Chile — Régimen de Importaciones Postales y Envíos Express',
    uri: 'https://www.aduana.cl/importaciones-por-envios-postales-o-courrier/aduana/2018-12-11/120235.html'
  },
  {
    title: 'Servicio de Impuestos Internos (SII) — Ley N° 21.713 de Cumplimiento Tributario',
    uri: 'https://www.sii.cl/normativa_legislacion/leyes/2024/ley21713.pdf'
  },
  {
    title: 'SERNAC — Reglamento de Comercio Electrónico y Derechos del Consumidor (Decreto 6)',
    uri: 'https://www.sernac.cl/portal/619/w3-article-61921.html'
  },
  {
    title: 'Diario Financiero — Aduanas y Plataformas Digitales: Cobro de IVA a paquetes transfronterizos',
    uri: 'https://www.df.cl/economia-y-politica/fiscal/reforma-tributaria-aduanas-y-comercio-digital'
  },
  {
    title: 'Comisión para el Mercado Financiero (CMF) — Tasas de intercambio y medios de pago',
    uri: 'https://www.cmfchile.cl'
  }
];

export const INITIAL_COMPLIANCE_MILESTONES: ComplianceMilestone[] = [
  {
    id: 'm-1',
    title: 'Fin Definitivo a la Exención de US$ 41',
    dateOrDeadline: 'En plena vigencia',
    description: 'Todo paquete o compra internacional de bienes físicos paga 19% IVA, sin importar que el valor sea inferior a 41 dólares.',
    entity: 'Servicio de Impuestos Internos / Aduanas',
    status: 'vigente',
    lawReference: 'Ley N° 21.713'
  },
  {
    id: 'm-2',
    title: 'Registro Obligatorio RESIVA para Plataformas Extranjeras',
    dateOrDeadline: 'Vigente desde 2025/2026',
    description: 'AliExpress, Shein, Temu y marketplaces globales deben registrarse ante el SII para retener y declarar el 19% IVA en el checkout.',
    entity: 'SII Chile',
    status: 'vigente',
    lawReference: 'Circular N° 45 SII'
  },
  {
    id: 'm-3',
    title: 'Obligación de Inicio de Actividades ante Pasarelas de Pago',
    dateOrDeadline: 'Desde 2026',
    description: 'Transbank, Mercado Pago, Flow y adquirentes deben validar que todo comercio vendedor tenga RUT e Inicio de Actividades en primera categoría.',
    entity: 'SII / Pasarelas de Pago',
    status: 'en_fiscalizacion',
    lawReference: 'Ley N° 21.713 Art. 68 bis'
  },
  {
    id: 'm-4',
    title: 'Reporte de Más de 50 Transferencias Bancarias',
    dateOrDeadline: 'Semestral / Mensual activo',
    description: 'Bancos e instituciones financieras informan al SII los RUTs que reciban más de 50 abonos de distintas personas al mes o 100 en un semestre.',
    entity: 'Bancos & CMF',
    status: 'en_fiscalizacion',
    lawReference: 'Ley N° 21.713 Art. 85 bis'
  },
  {
    id: 'm-5',
    title: 'Garantía Legal Extendida de 6 Meses y Transparencia SERNAC',
    dateOrDeadline: 'Obligatorio en todo e-commerce',
    description: 'Plazo legal de 6 meses para cambio, reparación o devolución en caso de defecto técnico. Prohibido exigir empaque intacto en caso de falla.',
    entity: 'SERNAC',
    status: 'vigente',
    lawReference: 'Ley N° 19.496 Art. 20'
  }
];

export const INITIAL_MARKET_NEWS: MarketNewsItem[] = [
  {
    id: 'news-1',
    title: 'Aduanas y SII intensifican fiscalización a paquetería express tras fin de exención de US$ 41',
    summary: 'El Servicio Nacional de Aduanas junto a Correos de Chile comenzaron a aplicar el cobro sistemático del 19% de IVA a todas las compras de comercio electrónico transfronterizo menores a 41 dólares. Las plataformas que operan bajo el régimen simplificado retienen el impuesto al momento del pago digital.',
    source: 'Servicio Nacional de Aduanas / Reportes Oficiales',
    url: 'https://www.aduana.cl',
    date: 'Actualizado Septiembre 2026',
    category: 'aduanas_sii',
    impactLevel: 'critico',
    affectedEntity: 'Aduanas de Chile & SII',
    actionForStore: 'Ajustar el modelo financiero: suma siempre el 19% de IVA en el costo landed CIF para no liquidar márgenes netos. Si compras vía DSers/AliExpress con IVA cobrado en origen, guarda el comprobante para justificar el costo.',
    tags: ['Ley 21.713', 'IVA 19%', 'AliExpress', 'Aduana Express', 'Costo Landed']
  },
  {
    id: 'news-2',
    title: 'SERNAC publica circular sobre plazos de entrega y transparencia en tiendas de dropshipping',
    summary: 'El Servicio Nacional del Consumidor emitió directrices para fiscalizar tiendas virtuales que no transparentan que sus productos son despachados desde el extranjero. Se exige indicar de forma destacada el plazo real estimado (en días hábiles) antes del pago y contar con canal de reclamos accesible.',
    source: 'SERNAC Chile — Boletín de Protección al Consumidor',
    url: 'https://www.sernac.cl',
    date: 'Septiembre 2026',
    category: 'sernac',
    impactLevel: 'alto',
    affectedEntity: 'SERNAC',
    actionForStore: 'Publica en la ficha del producto y en el footer: "Despacho internacional: 15 a 25 días hábiles con código de seguimiento". Evita promesas falsas de "24 horas" a menos que utilices bodegaje local con Dropi.',
    tags: ['SERNAC', 'Transparencia', 'Tiempos de Entrega', 'Derechos Consumidor']
  },
  {
    id: 'news-3',
    title: 'Pasarelas de pago locales comienzan a exigir DTE y RUT de empresa para giros automáticos',
    summary: 'En cumplimiento del paquete antievasión, las pasarelas como Webpay Plus (Transbank), Mercado Pago y Flow están solicitando a las cuentas comerciales la acreditación de inicio de actividades ante el SII y el giro comercial correspondiente para mantener habilitado el cobro con cuotas.',
    source: 'Asociación Fintech de Chile & CMF',
    url: 'https://www.cmfchile.cl',
    date: 'Agosto 2026',
    category: 'pasarelas',
    impactLevel: 'alto',
    affectedEntity: 'Transbank / Mercado Pago / Flow',
    actionForStore: 'Crea tu SpA en Tu Empresa en un Día y obtén RUT en el SII en el Régimen Pro Pyme General (14 D N°3). No operes con CuentaRUT personal si esperas superar las 50 transacciones mensuales.',
    tags: ['Webpay Plus', 'Mercado Pago', 'Cumplimiento SII', 'SpA']
  },
  {
    id: 'news-4',
    title: 'Correos de Chile y Chilexpress digitalizan convenios de última milla para envíos internacionales',
    summary: 'La integración entre operadores logísticos y aduana mediante el sistema de manifiestos electrónicos anticipados ha reducido los tiempos de permanencia en el terminal aéreo de Pudahuel de 12 días promedio a entre 3 y 5 días hábiles para paquetería trazable.',
    source: 'Cámara de Comercio de Santiago (CCS) Logística',
    url: 'https://www.ccs.cl',
    date: 'Septiembre 2026',
    category: 'logistica',
    impactLevel: 'medio',
    affectedEntity: 'Correos de Chile / Chilexpress',
    actionForStore: 'Utiliza siempre métodos de envío AliExpress Standard Shipping o CJ Packet con trazabilidad local activa (número de seguimiento compatible con Correos de Chile) para evitar reclamos.',
    tags: ['Logística', 'Última Milla', 'Trazabilidad', 'Correos de Chile']
  },
  {
    id: 'news-5',
    title: 'Bancos e instituciones financieras implementan reporte de 50 transferencias mensuales',
    summary: 'Comenzó a regir el envío automatizado de antecedentes bancarios al SII para cuentas que acumulen 50 o más transferencias de distintos titulares en un mes calendario. El SII cruza esta información con las boletas electrónicas emitidas.',
    source: 'Servicio de Impuestos Internos (SII) — Noticias Tributarias',
    url: 'https://www.sii.cl',
    date: 'Reciente 2026',
    category: 'aduanas_sii',
    impactLevel: 'critico',
    affectedEntity: 'Servicio de Impuestos Internos',
    actionForStore: 'Emite Boleta Electrónica (DTE 39) de manera automatizada conectando tu Shopify con Facto, Lioren o LibreDTE. Nunca recibas pagos manuales de clientes sin respaldo contable formal.',
    tags: ['50 Transferencias', 'Fiscalización SII', 'DTE 39', 'Boleta Electrónica']
  },
  {
    id: 'news-6',
    title: 'Tendencia en pauta publicitaria en Chile: TikTok Ads supera el 40% del tráfico de captación e-commerce',
    summary: 'El costo por mil impresiones (CPM) en Meta se estabilizó en torno a $4.500 CLP, mientras que TikTok Ads ofrece CPMs de entre $2.800 y $3.500 CLP con creativos nativos tipo User Generated Content (UGC) grabados con modismos locales.',
    source: 'E-commerce Trends Latam & IAB Chile',
    url: 'https://www.iab.cl',
    date: 'Septiembre 2026',
    category: 'general',
    impactLevel: 'medio',
    affectedEntity: 'Meta Ads & TikTok Ads Chile',
    actionForStore: 'Diseña hooks de video de 3 segundos con subtítulos grandes en amarillo/blanco y llamado a la acción enfocado en "Envío a Todo Chile y Pago Seguro con Webpay".',
    tags: ['TikTok Ads', 'Meta Ads', 'CPA', 'Tráfico Pagado']
  }
];
