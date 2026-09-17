/**
 * Motor de Cumplimiento Tributario, Aduanero y Legal - E-commerce Chile 2026
 * Aplica rigurosamente:
 * - Ley N° 21.713 de Cumplimiento Tributario (Control de informalidad, eliminación de exención US$ 41)
 * - Normativa Aduanera de Chile (Ordenanza de Aduanas, DIN vs. Couriers, umbral US$ 500)
 * - Código Tributario y Formulario 29 (F29) - IVA Débito vs. IVA Crédito Fiscal
 * - Ley N° 19.496 sobre Protección de los Derechos de los Consumidores (SERNAC - Garantía Legal 6 meses)
 */

export interface EconomicActivityCode {
  code: string;
  name: string;
  category: string;
  vatStatus: 'Afecto a IVA' | 'Exento de IVA';
  internetAllowed: boolean;
  description: string;
  recommendedFor: string;
}

export const SII_ECOMMERCE_CODES: EconomicActivityCode[] = [
  {
    code: '479100',
    name: 'Venta al por menor por correo, por internet y vía telefónica',
    category: '1ra Categoría',
    vatStatus: 'Afecto a IVA',
    internetAllowed: true,
    description: 'Código principal y obligatorio para cualquier tienda online (Shopify, WooCommerce, Mercado Libre) que venda productos físicos directamente al consumidor final (B2C) en Chile.',
    recommendedFor: 'Código principal obligatorio para dropshipping y retail online B2C.'
  },
  {
    code: '469000',
    name: 'Venta al por mayor no especializada',
    category: '1ra Categoría',
    vatStatus: 'Afecto a IVA',
    internetAllowed: true,
    description: 'Permite comercializar lotes o packs a revendedores o empresas (B2B), útil cuando se escala volumen o se distribuye a otros comercios locales.',
    recommendedFor: 'Recomendado como código secundario si planeas vender al por mayor o packs corporativos.'
  },
  {
    code: '479900',
    name: 'Otras actividades de venta al por menor no realizada en comercios, puestos de venta o mercados',
    category: '1ra Categoría',
    vatStatus: 'Afecto a IVA',
    internetAllowed: true,
    description: 'Ventas directas a domicilio o catálogos interactivos complementarios.',
    recommendedFor: 'Código complementario de respaldo.'
  },
  {
    code: '522990',
    name: 'Otras actividades de apoyo al transporte n.c.p. (Logística y Fulfillment)',
    category: '1ra Categoría',
    vatStatus: 'Afecto a IVA',
    internetAllowed: true,
    description: 'Útil si ofreces servicios de intermediación logística o bodegaje a terceros.',
    recommendedFor: 'Opcional si operas fulfillment para otros merchants.'
  }
];

export interface TaxAuditRiskInput {
  monthlyImportUSD: number;
  hasRUTEmpresa: boolean;
  emitsDTE: boolean; // Emite Boletas Electrónicas (DTE 39) o Facturas (DTE 33)
  importsOver500USDCount: number; // Cantidad de envíos > USD 500 al mes
  usesCustomsBrokerForLargeShipments: boolean; // Usa agente de aduanas cuando supera USD 500
  declaresAllPurchasesInRCV: boolean;
  bankAccountType: 'personal' | 'empresa';
}

export interface TaxAuditRiskOutput {
  riskLevel: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
  riskScore: number; // 0 - 100 (mayor es más riesgoso)
  summary: string;
  reasons: string[];
  mitigations: string[];
  siiAlerts: string[];
  customsAlerts: string[];
}

/**
 * Audita el nivel de riesgo tributario y aduanero bajo la Ley N° 21.713
 */
export function auditTaxRiskLevel(input: TaxAuditRiskInput): TaxAuditRiskOutput {
  let score = 0;
  const reasons: string[] = [];
  const mitigations: string[] = [];
  const siiAlerts: string[] = [];
  const customsAlerts: string[] = [];

  // 1. Informalidad de RUT (Peligro mayor bajo Ley 21.713)
  if (!input.hasRUTEmpresa) {
    score += 40;
    reasons.push('Operación bajo RUT Persona Natural: Transbank y Mercado Pago informan automáticamente transacciones recurrentes al SII (norma de más de 50 transferencias o $5M).');
    siiAlerts.push('Alerta de Presunción de Renta: Riesgo inminente de citación del SII por comercio no formalizado y omisión de IVA.');
    mitigations.push('Constituir SpA en "Tu Empresa en un Día" y obtener RUT Empresa en 1ra Categoría de forma urgente.');
  } else {
    // Si tiene RUT empresa pero usa cuenta personal
    if (input.bankAccountType === 'personal') {
      score += 15;
      reasons.push('Uso de cuenta bancaria personal para recaudar fondos de la empresa (confusión patrimonial).');
      mitigations.push('Abrir Cuenta Corriente o Vista a nombre del RUT Empresa (BancoEstado, BCI, Santander, etc.).');
    }
  }

  // 2. Emisión de DTE (Boleta Electrónica 39)
  if (!input.emitsDTE) {
    score += 35;
    reasons.push('Venta sin emisión de Boleta Electrónica de Ventas y Servicios (DTE 39) al cliente final.');
    siiAlerts.push('Infracción grave al Art. 97 N° 10 del Código Tributario (clausura de establecimiento virtual o multas de hasta 40 UTM).');
    mitigations.push('Integrar un software de facturación electrónica conectado al SII (ej: LibreDTE, Bsale, OpenFactura, SimpleBoleta).');
  }

  // 3. Importaciones mayores a USD 500 sin Agente de Aduanas
  if (input.importsOver500USDCount > 0 && !input.usesCustomsBrokerForLargeShipments) {
    score += 25;
    reasons.push(`Tiene ${input.importsOver500USDCount} envío(s) mensual(es) > USD 500 tramitados sin Declaración de Ingreso (DIN) vía Agente de Aduanas.`);
    customsAlerts.push('Aduanas retendrá el paquete en fiscalización y aplicará multas por subdeclaración o trámite fuera de plazo.');
    mitigations.push('Contratar un Agente de Aduanas colegiado para todo despacho que exceda USD 500 CIF, o solicitar fraccionamiento justificado.');
  }

  // 4. Registro de compras y ventas (RCV)
  if (!input.declaresAllPurchasesInRCV) {
    score += 15;
    reasons.push('Pérdida de IVA Crédito Fiscal: No estás acreditando el IVA de las compras internacionales o nacionales en el RCV.');
    mitigations.push('Solicitar siempre la Declaración de Ingreso Courier o DIN con el RUT Empresa para imputar el 19% de IVA en el F29.');
  }

  // 5. Volumen alto de importación
  if (input.monthlyImportUSD > 3000 && !input.hasRUTEmpresa) {
    score += 20;
    reasons.push('Volumen de importación elevado (> US$ 3.000/mes) sin respaldo contable corporativo.');
  }

  score = Math.min(100, score);

  let riskLevel: 'Bajo' | 'Medio' | 'Alto' | 'Crítico' = 'Bajo';
  if (score >= 70) riskLevel = 'Crítico';
  else if (score >= 45) riskLevel = 'Alto';
  else if (score >= 20) riskLevel = 'Medio';

  let summary = 'Operación formal y alineada a las exigencias tributarias y aduaneras 2026.';
  if (riskLevel === 'Crítico') {
    summary = 'ALTO RIESGO DE BLOQUEO Y MULTAS: Tu tienda opera en el radar prioritario de fiscalización del SII y Aduanas tras la Ley 21.713.';
  } else if (riskLevel === 'Alto') {
    summary = 'Vulnerabilidades detectadas: Puedes enfrentar retenciones preventivas de fondos en pasarelas o aduanas si no corriges los puntos indicados.';
  } else if (riskLevel === 'Medio') {
    summary = 'Riesgo moderado: Cumples los aspectos clave pero estás dejando dinero sobre la mesa o tienes pequeñas brechas administrativas.';
  }

  return {
    riskLevel,
    riskScore: score,
    summary,
    reasons,
    mitigations,
    siiAlerts,
    customsAlerts
  };
}

export interface F29TaxImpactInput {
  monthlySalesGrossCLP: number; // Ventas brutas totales (con IVA incluido)
  monthlyImportsCIF_USD: number; // Costo CIF importaciones en USD
  exchangeRate?: number; // Dólar observado (default 940)
  hasCustomsProofWithRUT: boolean; // ¿Tiene comprobante DIN/Courier con RUT empresa?
  domesticPurchasesNetCLP?: number; // Compras locales netas (envases, insumos, software)
  otherExpensesNetCLP?: number; // Gastos operativos afectos a IVA (publicidad, bodegaje)
}

export interface F29TaxImpactOutput {
  salesGrossCLP: number;
  salesNetCLP: number;
  ivaDebitoFiscalCLP: number; // 19% cobrado a clientes
  cifImportsCLP: number;
  customsTariffCLP: number; // 6% si aplica
  ivaImportPaidCLP: number; // 19% pagado en aduana
  ivaCreditoFiscalImportCLP: number; // IVA recuperable si tiene RUT empresa
  ivaCreditoFiscalLocalCLP: number; // IVA de compras locales
  totalIvaCreditoFiscalCLP: number;
  netF29TaxPayableCLP: number; // Saldo a pagar o remanente
  hasRemanente: boolean;
  lostTaxCreditCLP: number; // IVA pagado en aduana pero perdido por no tener RUT empresa
  formalizationSavingsAnnualCLP: number; // Ahorro anual al recuperar IVA como empresa formal
}

/**
 * Calcula el impacto financiero y tributario en el Formulario 29 (F29) mensual del SII.
 */
export function calculateF29TaxImpact(input: F29TaxImpactInput): F29TaxImpactOutput {
  const exchangeRate = input.exchangeRate || 940;
  const domesticNet = input.domesticPurchasesNetCLP || 0;
  const otherExpensesNet = input.otherExpensesNetCLP || 0;

  // 1. Desglose de Ventas (PVP contiene 19% IVA)
  // Ventas Netas = Ventas Brutas / 1.19
  const salesGrossCLP = Math.max(0, input.monthlySalesGrossCLP);
  const salesNetCLP = Math.round(salesGrossCLP / 1.19);
  const ivaDebitoFiscalCLP = salesGrossCLP - salesNetCLP;

  // 2. Importaciones y Aduana
  const cifUSD = Math.max(0, input.monthlyImportsCIF_USD);
  const cifImportsCLP = Math.round(cifUSD * exchangeRate);
  
  // Arancel Ad-Valorem 6% si el envío unitario promedio supera USD 500
  const customsTariffCLP = cifUSD > 500 ? Math.round(cifImportsCLP * 0.06) : 0;
  
  // IVA 19% Pagado en Aduana (Ley 21.713 aplica siempre sobre CIF + Arancel)
  const ivaImportBaseCLP = cifImportsCLP + customsTariffCLP;
  const ivaImportPaidCLP = Math.round(ivaImportBaseCLP * 0.19);

  // 3. IVA Crédito Fiscal
  // Si tiene RUT empresa acreditado en la DIN o courier, el IVA importación es 100% recuperable como Crédito Fiscal
  const ivaCreditoFiscalImportCLP = input.hasCustomsProofWithRUT ? ivaImportPaidCLP : 0;
  const lostTaxCreditCLP = input.hasCustomsProofWithRUT ? 0 : ivaImportPaidCLP;

  // Crédito fiscal por compras locales (19% de gastos netos facturados con DTE 33)
  const ivaCreditoFiscalLocalCLP = Math.round((domesticNet + otherExpensesNet) * 0.19);

  const totalIvaCreditoFiscalCLP = ivaCreditoFiscalImportCLP + ivaCreditoFiscalLocalCLP;

  // 4. Saldo F29 (IVA Débito - IVA Crédito)
  const diff = ivaDebitoFiscalCLP - totalIvaCreditoFiscalCLP;
  const netF29TaxPayableCLP = Math.max(0, diff);
  const hasRemanente = diff < 0;

  // Ahorro anual recuperando el IVA de importación
  const formalizationSavingsAnnualCLP = ivaImportPaidCLP * 12;

  return {
    salesGrossCLP,
    salesNetCLP,
    ivaDebitoFiscalCLP,
    cifImportsCLP,
    customsTariffCLP,
    ivaImportPaidCLP,
    ivaCreditoFiscalImportCLP,
    ivaCreditoFiscalLocalCLP,
    totalIvaCreditoFiscalCLP,
    netF29TaxPayableCLP,
    hasRemanente,
    lostTaxCreditCLP,
    formalizationSavingsAnnualCLP
  };
}

export interface LegalPolicyParams {
  storeName: string;
  legalEntityName: string; // Razón Social SpA
  companyRUT: string;
  legalAddress: string;
  city: string;
  supportEmail: string;
  supportPhone: string;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  warrantyMonths?: number; // default 6 meses SERNAC
  courtesyReturnDays?: number; // default 10 o 30 días
}

/**
 * Generador de Políticas Legales SERNAC y Términos para Tiendas Online en Chile
 */
export function generateTermsAndConditions(params: LegalPolicyParams): string {
  return `# TÉRMINOS Y CONDICIONES DE USO Y COMPRA
**Última actualización:** Septiembre de 2026
**Sitio Web:** ${params.storeName}
**Razón Social:** ${params.legalEntityName}
**RUT Empresa:** ${params.companyRUT}
**Domicilio Legal:** ${params.legalAddress}, ${params.city}, Chile.
**Contacto:** ${params.supportEmail} | Teléfono: ${params.supportPhone}

---

### 1. ASPECTOS GENERALES Y ACEPTACIÓN
El presente documento regula los términos y condiciones de compra y contratación de productos ofrecidos a través del sitio web de **${params.storeName}**, de propiedad de **${params.legalEntityName}**, RUT **${params.companyRUT}**, en estricta conformidad con la legislación de la República de Chile, especialmente la **Ley N° 19.496 sobre Protección de los Derechos de los Consumidores** (modificada por la Ley Pro-Consumidor), el **Decreto Supremo N° 6 del Ministerio de Economía (Reglamento de Comercio Electrónico)** y la **Ley N° 21.713 de Cumplimiento Tributario**.

Al navegar, registrarse o adquirir cualquier producto en este sitio, el usuario declara haber leído, comprendido y aceptado íntegramente estas estipulaciones.

### 2. PRECIOS, MONEDA E IMPUESTOS
Todos los precios publicados en este sitio web están expresados en **Pesos Chilenos (CLP)** e incluyen de manera explícita el **Impuesto al Valor Agregado (IVA) del 19%**, conforme a las directrices del Servicio de Impuestos Internos (SII).
Por cada transacción efectuada, **${params.legalEntityName}** emitirá y enviará al correo electrónico registrado por el cliente la respectiva **Boleta Electrónica de Ventas y Servicios (DTE 39)** o **Factura Electrónica (DTE 33)** si el comprador ingresa su RUT societario antes de finalizar el pago.

### 3. MEDIOS DE PAGO AUTORIZADOS
Los pagos se procesan de manera cifrada a través de pasarelas de pago certificadas en Chile (Webpay Plus de Transbank, Mercado Pago y medios de prepago autorizados). El cargo se efectuará de forma inmediata al confirmar la orden. **${params.storeName}** no almacena datos de tarjetas de crédito o débito.

### 4. PLAZOS Y CONDICIONES DE DESPACHO
Los envíos se realizan a las 16 regiones del territorio chileno mediante operadores logísticos locales (Chilexpress, Starken, Blue Express o Correos de Chile).
- **Plazo estimado de entrega:** Entre **${params.deliveryDaysMin} y ${params.deliveryDaysMax} días hábiles** contados desde la confirmación de la orden y emisión del código de seguimiento.
- En caso de fuerza mayor o contingencias aduaneras extraordinarias, se informará oportunamente al cliente el estado de su encomienda vía email o WhatsApp.

### 5. GARANTÍA LEGAL DE 6 MESES (LEY N° 19.496 / SERNAC)
Todo producto comercializado cuenta con la **Garantía Legal obligatoria de 6 (seis) meses** a partir de su recepción, ante fallas de fabricación o defectos de origen que impidan su uso regular.
El consumidor tiene el derecho irrenunciable de elegir libremente entre:
1. **Devolución íntegra del dinero pagado** (100% de reembolso).
2. **Cambio del producto por uno nuevo**.
3. **Reparación gratuita del producto**.

Para hacer efectiva la garantía, el cliente debe presentar su boleta electrónica o comprobante de compra contactando a **${params.supportEmail}**. No se exigirá el embalaje original en condiciones perfectas tratándose de fallas de fábrica.

### 6. DERECHO A RETRACTO Y SATISFACCIÓN
En cumplimiento del Artículo 3 bis letra b) de la Ley N° 19.496, el comprador podrá retractarse unilateralmente de la compra dentro del plazo de **10 (diez) días corridos** contados desde la recepción del bien, siempre que este se encuentre sin uso, con sus sellos y empaques originales intactos.

### 7. JURISDICCIÓN Y COMPETENCIA
Para todos los efectos legales derivados del presente contrato, las partes fijan su domicilio en la ciudad de **${params.city}**, sometiéndose a la competencia de los Tribunales Ordinarios de Justicia de Chile y a la mediación del Servicio Nacional del Consumidor (SERNAC).`;
}

export function generateReturnPolicy(params: LegalPolicyParams): string {
  const warranty = params.warrantyMonths || 6;
  const courtesy = params.courtesyReturnDays || 10;

  return `# POLÍTICA DE DEVOLUCIONES, REEMBOLSOS Y GARANTÍA LEGAL (CHILE 2026)
**Tienda:** ${params.storeName} (${params.legalEntityName} — RUT ${params.companyRUT})
**Canal de Atención de Garantías:** ${params.supportEmail} | WhatsApp: ${params.supportPhone}
**Marco Regulatorio:** Ley N° 19.496 del Consumidor / Estándar SERNAC.

---

### 1. DERECHO A LA GARANTÍA LEGAL (6 MESES)
En ${params.storeName} cumplimos estrictamente el estándar legal de protección al consumidor en Chile. Si el producto que adquiriste presenta fallas de fábrica, defectos técnicos o no cumple con las especificaciones informadas, tienes un plazo legal de **${warranty} meses contados desde la recepción del pedido** para ejercer tu derecho de garantía legal.

### 2. TUS 3 OPCIONES IRRENUNCIABLES (3X3 DEL CONSUMIDOR)
Frente a una falla de origen, el consumidor tiene la facultad exclusiva de elegir entre:
- **Opción A: Devolución total del 100% de su dinero** (reembolso directo a su cuenta bancaria en un plazo máximo de 3 a 5 días hábiles tras la verificación).
- **Opción B: Cambio inmediato por una unidad nueva idéntica**.
- **Opción C: Reparación gratuita** sin costo de traslado o repuestos.

*Nota SERNAC:* La empresa no derivará al cliente de forma arbitraria a un servicio técnico si el consumidor opta por la devolución de su dinero o el cambio, salvo necesidad fundada de constatación técnica de falla objetiva.

### 3. DERECHO A RETRACTO POR COMPRAS ELECTRÓNICAS (10 DÍAS)
Si compraste un producto y te arrepentiste de tu decisión, puedes solicitar el retracto dentro de los **${courtesy} días corridos** siguientes a la entrega, siempre y cuando el producto se encuentre sin uso, sellado y en condiciones idóneas para su comercialización. Los costos razonables de transporte por retracto corren por cuenta del cliente, salvo promoción de satisfacción garantizada expresa.

### 4. PROCEDIMIENTO PASO A PASO PARA SOLICITAR UNA DEVOLUCIÓN:
1. **Envío de solicitud:** Escribe a **${params.supportEmail}** indicando tu número de orden o RUT del comprador y adjuntando un breve video o foto del defecto.
2. **Generación de Etiqueta Prepagada:** Te enviaremos una etiqueta prepagada para dejar el bulto en cualquier sucursal de Chilexpress o Starken del país sin costo para ti si se trata de garantía legal.
3. **Resolución:** Recibido el producto en nuestra bodega central en **${params.city}**, se procederá a ejecutar la opción elegida por el cliente dentro de las 72 horas hábiles siguientes.

### 5. PRODUCTOS EXCLUIDOS DE GARANTÍA POR MAL USO
La garantía no cubre daños provocados por golpes, inmersión indebida en agua si el producto no es sumergible, sobrevoltaje eléctrico por enchufes no certificados o manipulación externa no autorizada.`;
}

export function generatePrivacyPolicy(params: LegalPolicyParams): string {
  return `# POLÍTICA DE PRIVACIDAD Y PROTECCIÓN DE DATOS PERSONALES
**Responsable del Tratamiento:** ${params.legalEntityName} (RUT ${params.companyRUT})
**Nombre Comercial:** ${params.storeName}
**Domicilio:** ${params.legalAddress}, ${params.city}, Chile.
**Email del Oficial de Privacidad:** ${params.supportEmail}

---

### 1. COMPROMISO DE PRIVACIDAD
En **${params.storeName}** respetamos profundamente la confidencialidad de nuestros clientes y tratamos sus datos personales en estricto apego a la **Ley N° 19.628 sobre Protección de la Vida Privada** y sus modificaciones, así como a las recomendaciones del Reglamento de Comercio Electrónico de Chile.

### 2. DATOS QUE RECOLECTAMOS
Únicamente solicitamos y procesamos los datos estrictamente indispensables para concretar la compraventa y el despacho:
- **Datos de identificación y contacto:** Nombre completo, RUT, correo electrónico y número de teléfono móvil.
- **Datos de entrega:** Dirección exacta de despacho, comuna y región de Chile.
- **Datos tributarios:** RUT, razón social y giro para la emisión de Facturas Electrónicas (DTE 33) cuando el cliente lo requiera.
- **No almacenamos datos de pago:** Los números de tarjetas de crédito o débito son procesados directamente por Transbank (Webpay) o Mercado Pago bajo certificación PCI-DSS nivel 1.

### 3. FINALIDAD DEL TRATAMIENTO
Tus datos serán utilizados exclusivamente para:
- Procesar, despachar y dar seguimiento en tiempo real a tu compra.
- Emitir la Boleta o Factura Electrónica conforme a las obligaciones del Servicio de Impuestos Internos (SII).
- Atender solicitudes de garantía o consultas de postventa.
- Comunicar promociones o descuentos únicamente si el usuario ha otorgado su consentimiento explícito previo (opt-in).

### 4. TRANSFERENCIA A TERCEROS
Tus datos de despacho (nombre, dirección, teléfono) son compartidos únicamente con los operadores logísticos certificados en Chile (Chilexpress, Starken, Blue Express o Correos de Chile) para la exclusiva ejecución material de la entrega. Jamás vendemos, arrendamos ni comercializamos bases de datos con terceros.

### 5. EJERCICIO DE DERECHOS ARCO (ACCESO, RECTIFICACIÓN, CANCELACIÓN Y OPOSICIÓN)
El titular de los datos puede ejercer en cualquier momento sus derechos de acceso, actualización o eliminación definitiva de sus antecedentes de nuestras bases enviando un correo a **${params.supportEmail}**.`;
}
