/**
 * Motor Logístico, Fulfillment & APIs de Envíos - Chile 2026
 * Modelos de Couriers: Starken, Blue Express, Chilexpress, Chazki/99Minutos
 * Fórmulas de peso volumétrico estándar Courier Chile: (L * W * H) / 4000
 * Análisis comparativo de Unit Economics: In-House vs 3PL
 * Validación estricta con Zod
 */

import { z } from 'zod';

// ==========================================
// 1. Zod Schemas para Validación Estricta
// ==========================================

export const ParcelDimensionsSchema = z.object({
  lengthCm: z.number().min(1, 'El largo mínimo es 1 cm').max(250, 'El largo máximo es 250 cm'),
  widthCm: z.number().min(1, 'El ancho mínimo es 1 cm').max(250, 'El ancho máximo es 250 cm'),
  heightCm: z.number().min(1, 'El alto mínimo es 1 cm').max(250, 'El alto máximo es 250 cm'),
  weightKg: z.number().min(0.05, 'El peso mínimo es 0.05 kg').max(100, 'El peso máximo es 100 kg'),
});

export type ParcelDimensions = z.infer<typeof ParcelDimensionsSchema>;

export const ChileanZoneSchema = z.enum([
  'rm_urbana',
  'rm_periferica',
  'centro_cercano',
  'regiones_principales',
  'norte_grande',
  'zonas_extremas'
]);

export type ChileanZone = z.infer<typeof ChileanZoneSchema>;

export interface ComunaInfo {
  name: string;
  region: string;
  zone: ChileanZone;
  slaFactorDays: number;
}

export const CHILE_COMUNAS: ComunaInfo[] = [
  { name: 'Santiago Centro', region: 'Metropolitana', zone: 'rm_urbana', slaFactorDays: 0 },
  { name: 'Las Condes / Vitacura / Lo Barnechea', region: 'Metropolitana', zone: 'rm_urbana', slaFactorDays: 0 },
  { name: 'Providencia / Ñuñoa', region: 'Metropolitana', zone: 'rm_urbana', slaFactorDays: 0 },
  { name: 'Maipú / Pudahuel', region: 'Metropolitana', zone: 'rm_urbana', slaFactorDays: 0 },
  { name: 'La Florida / Puente Alto', region: 'Metropolitana', zone: 'rm_urbana', slaFactorDays: 0 },
  { name: 'Colina / Chicureo', region: 'Metropolitana', zone: 'rm_periferica', slaFactorDays: 0.5 },
  { name: 'Buin / Paine / Talagante', region: 'Metropolitana', zone: 'rm_periferica', slaFactorDays: 0.5 },
  { name: 'Viña del Mar / Valparaíso', region: 'Valparaíso', zone: 'centro_cercano', slaFactorDays: 1 },
  { name: 'Rancagua / Machalí', region: 'O\'Higgins', zone: 'centro_cercano', slaFactorDays: 1 },
  { name: 'Concepción / Talcahuano / San Pedro', region: 'Biobío', zone: 'regiones_principales', slaFactorDays: 1.5 },
  { name: 'La Serena / Coquimbo', region: 'Coquimbo', zone: 'regiones_principales', slaFactorDays: 1.5 },
  { name: 'Temuco / Padre Las Casas', region: 'La Araucanía', zone: 'regiones_principales', slaFactorDays: 1.5 },
  { name: 'Puerto Montt / Puerto Varas', region: 'Los Lagos', zone: 'regiones_principales', slaFactorDays: 2 },
  { name: 'Antofagasta / Calama', region: 'Antofagasta', zone: 'norte_grande', slaFactorDays: 2 },
  { name: 'Iquique / Alto Hospicio', region: 'Tarapacá', zone: 'norte_grande', slaFactorDays: 2.5 },
  { name: 'Punta Arenas / Puerto Natales', region: 'Magallanes', zone: 'zonas_extremas', slaFactorDays: 3.5 },
  { name: 'Coyhaique / Aysén', region: 'Aysén', zone: 'zonas_extremas', slaFactorDays: 4 },
];

// ==========================================
// 2. Modelo de Couriers en Chile 2026
// ==========================================

export type CourierId = 'starken' | 'blue_express' | 'chilexpress' | 'chazki_99minutos';

export interface CourierOption {
  id: CourierId;
  name: string;
  tagline: string;
  logoColor: string;
  coverageDescription: string;
  supportsHomeDelivery: boolean;
  supportsPudoPickUpPoints: boolean;
  supportsSameDayRM: boolean;
  supportsCOD: boolean;
  codFeeDescription: string;
  baseRateCLP: number;
  ratePerBillableKgCLP: number;
  zoneMultiplier: Record<ChileanZone, number>;
  slaHours: Record<ChileanZone, { min: number; max: number; label: string }>;
  keyStrengths: string[];
  recommendedFor: string;
}

export const CHILE_COURIERS: CourierOption[] = [
  {
    id: 'starken',
    name: 'Starken',
    tagline: 'Red capilar nacional y paquetes de medio/alto volumen',
    logoColor: '#e11d48', // rose-600
    coverageDescription: 'Más de 400 sucursales en todo Chile, fuerte presencia en provincias y regiones rurales.',
    supportsHomeDelivery: true,
    supportsPudoPickUpPoints: true,
    supportsSameDayRM: false,
    supportsCOD: true,
    codFeeDescription: '2.5% del valor recaudado (Mínimo $1.500 CLP)',
    baseRateCLP: 3200,
    ratePerBillableKgCLP: 650,
    zoneMultiplier: {
      rm_urbana: 1.0,
      rm_periferica: 1.15,
      centro_cercano: 1.25,
      regiones_principales: 1.55,
      norte_grande: 1.85,
      zonas_extremas: 2.90
    },
    slaHours: {
      rm_urbana: { min: 24, max: 48, label: '24 a 48 hrs' },
      rm_periferica: { min: 24, max: 48, label: '24 a 48 hrs' },
      centro_cercano: { min: 24, max: 72, label: '24 a 72 hrs' },
      regiones_principales: { min: 48, max: 96, label: '2 a 4 días' },
      norte_grande: { min: 72, max: 120, label: '3 a 5 días' },
      zonas_extremas: { min: 120, max: 216, label: '5 a 9 días' }
    },
    keyStrengths: [
      'Tarifa rebajada si el cliente retira en sucursal (~18% descuento)',
      'Excelente manejo de bultos pesados o voluminosos',
      'Cobro contra entrega (COD) consolidado en regiones'
    ],
    recommendedFor: 'Productos pesados/voluminosos (Hogar, Fitness) y clientes que prefieren retirar en agencia local.'
  },
  {
    id: 'blue_express',
    name: 'Blue Express',
    tagline: 'Líder en e-commerce con red de +2.000 Puntos Blue y Lockers Pudo',
    logoColor: '#0284c7', // sky-600
    coverageDescription: 'Amplia cobertura nacional con fuerte ecosistema digital e integración nativa Shopify/WooCommerce.',
    supportsHomeDelivery: true,
    supportsPudoPickUpPoints: true,
    supportsSameDayRM: false,
    supportsCOD: true,
    codFeeDescription: '2.8% sobre el cobro (integración vía API Blue)',
    baseRateCLP: 2990,
    ratePerBillableKgCLP: 580,
    zoneMultiplier: {
      rm_urbana: 1.0,
      rm_periferica: 1.12,
      centro_cercano: 1.22,
      regiones_principales: 1.50,
      norte_grande: 1.80,
      zonas_extremas: 2.75
    },
    slaHours: {
      rm_urbana: { min: 24, max: 48, label: '24 a 48 hrs' },
      rm_periferica: { min: 24, max: 48, label: '24 a 48 hrs' },
      centro_cercano: { min: 24, max: 48, label: '24 a 48 hrs' },
      regiones_principales: { min: 48, max: 72, label: '2 a 3 días' },
      norte_grande: { min: 72, max: 96, label: '3 a 4 días' },
      zonas_extremas: { min: 96, max: 168, label: '4 a 7 días' }
    },
    keyStrengths: [
      'Red de Lockers PUDO 24/7 (reduce tasa de fallas por morador ausente a < 2%)',
      'Generación masiva de etiquetas ZPL/PDF desde panel web y API REST',
      'Tarifas muy agresivas para paquetería e-commerce estándar (< 2 kg)'
    ],
    recommendedFor: 'El estándar recomendado para tiendas Shopify/WooCommerce de moda, gadgets, belleza y mascotas.'
  },
  {
    id: 'chilexpress',
    name: 'Chilexpress',
    tagline: 'Máxima puntualidad con entregas prioritarias garantizadas día hábil',
    logoColor: '#f59e0b', // amber-500
    coverageDescription: 'La flota aérea y terrestre más robusta del país con garantía de entrega prioritaria.',
    supportsHomeDelivery: true,
    supportsPudoPickUpPoints: true,
    supportsSameDayRM: false,
    supportsCOD: true,
    codFeeDescription: '3.0% del monto total recaudado',
    baseRateCLP: 3600,
    ratePerBillableKgCLP: 790,
    zoneMultiplier: {
      rm_urbana: 1.0,
      rm_periferica: 1.20,
      centro_cercano: 1.30,
      regiones_principales: 1.65,
      norte_grande: 1.95,
      zonas_extremas: 3.20
    },
    slaHours: {
      rm_urbana: { min: 12, max: 24, label: 'Día hábil siguiente (Priority)' },
      rm_periferica: { min: 18, max: 24, label: 'Día hábil siguiente' },
      centro_cercano: { min: 24, max: 24, label: '24 hrs garantizadas' },
      regiones_principales: { min: 24, max: 48, label: '24 a 48 hrs vía aérea' },
      norte_grande: { min: 48, max: 72, label: '48 a 72 hrs' },
      zonas_extremas: { min: 72, max: 120, label: '3 a 5 días hábiles' }
    },
    keyStrengths: [
      'Mayor cumplimiento de SLA del mercado (98.4% a tiempo)',
      'Cobertura en poblados y localidades donde ningún otro courier llega',
      'Ideal para pedidos urgentes o de alto valor asegurado'
    ],
    recommendedFor: 'Paquetes de alto ticket (> $50.000 CLP), tecnología delicada y entregas con compromiso estricto de fecha.'
  },
  {
    id: 'chazki_99minutos',
    name: 'Chazki / 99Minutos',
    tagline: 'Last-Mile Same-Day & Next-Day ultra veloz en Región Metropolitana',
    logoColor: '#10b981', // emerald-500
    coverageDescription: 'Especialistas de última milla urbana dedicados exclusivamente a carritos en RM.',
    supportsHomeDelivery: true,
    supportsPudoPickUpPoints: false,
    supportsSameDayRM: true,
    supportsCOD: false,
    codFeeDescription: 'No disponible / Solo pagos prepagados online',
    baseRateCLP: 3100,
    ratePerBillableKgCLP: 500,
    zoneMultiplier: {
      rm_urbana: 1.0,
      rm_periferica: 1.35,
      centro_cercano: 999, // No aplica
      regiones_principales: 999,
      norte_grande: 999,
      zonas_extremas: 999
    },
    slaHours: {
      rm_urbana: { min: 4, max: 8, label: 'Same-Day (Mismo día 4 a 8 hrs)' },
      rm_periferica: { min: 12, max: 24, label: 'Next-Day (12 a 24 hrs)' },
      centro_cercano: { min: 0, max: 0, label: 'Sin cobertura' },
      regiones_principales: { min: 0, max: 0, label: 'Sin cobertura' },
      norte_grande: { min: 0, max: 0, label: 'Sin cobertura' },
      zonas_extremas: { min: 0, max: 0, label: 'Sin cobertura' }
    },
    keyStrengths: [
      'Entregas el mismo día para pedidos recibidos con corte a las 13:00 hrs',
      'Aumenta la conversión de compra de usuarios en Santiago un 35%',
      'Tracking por GPS en tiempo real visible para el cliente'
    ],
    recommendedFor: 'Estrategia de conversión en Santiago ("Pídelo antes de las 13:00 y recíbelo hoy").'
  }
];

// ==========================================
// 3. Cálculos de Pesos y Tarifas de Courier
// ==========================================

export interface CourierCalculationResult {
  courier: CourierOption;
  volumetricWeightKg: number;
  billableWeightKg: number;
  calculatedRateCLP: number;
  pickupPointDiscountCLP: number;
  finalHomeRateCLP: number;
  finalPickupRateCLP: number;
  sla: string;
  isAvailableInZone: boolean;
  isCheapest: boolean;
  isFastest: boolean;
}

/**
 * Calcula el peso volumétrico según estándar chileno: (L x W x H) / 4000
 */
export function calculateVolumetricWeight(dimensions: ParcelDimensions): {
  volumetricWeightKg: number;
  billableWeightKg: number;
} {
  const parsed = ParcelDimensionsSchema.parse(dimensions);
  const volumeCm3 = parsed.lengthCm * parsed.widthCm * parsed.heightCm;
  // Factor courier estándar en Chile: 4000 cm3/kg
  const volumetricWeightKg = Number((volumeCm3 / 4000).toFixed(2));
  const billableWeightKg = Number(Math.max(parsed.weightKg, volumetricWeightKg).toFixed(2));

  return {
    volumetricWeightKg,
    billableWeightKg
  };
}

/**
 * Calcula y compara las tarifas de todos los couriers para una comuna específica
 */
export function compareCouriersForDestination(
  dimensions: ParcelDimensions,
  selectedComuna: ComunaInfo
): CourierCalculationResult[] {
  const { volumetricWeightKg, billableWeightKg } = calculateVolumetricWeight(dimensions);
  const zone = selectedComuna.zone;

  const results: CourierCalculationResult[] = CHILE_COURIERS.map((courier) => {
    const multiplier = courier.zoneMultiplier[zone];
    const isAvailableInZone = multiplier < 100;

    if (!isAvailableInZone) {
      return {
        courier,
        volumetricWeightKg,
        billableWeightKg,
        calculatedRateCLP: 0,
        pickupPointDiscountCLP: 0,
        finalHomeRateCLP: 0,
        finalPickupRateCLP: 0,
        sla: 'Sin cobertura en esta zona',
        isAvailableInZone: false,
        isCheapest: false,
        isFastest: false
      };
    }

    // Tarifa Base + Peso facturable incremental
    // Se cobra base que incluye primer kg, luego tarifa por kg adicional
    const extraKg = Math.max(0, billableWeightKg - 1);
    const rawRate = (courier.baseRateCLP + extraKg * courier.ratePerBillableKgCLP) * multiplier;
    const calculatedRateCLP = Math.round(rawRate / 10) * 10; // Redondeo a decenas

    // Descuento sucursal / PUDO si aplica (~18% de ahorro en Starken / Blue Express)
    const discountFactor = courier.supportsPudoPickUpPoints ? 0.18 : 0;
    const pickupPointDiscountCLP = Math.round(calculatedRateCLP * discountFactor);
    const finalPickupRateCLP = calculatedRateCLP - pickupPointDiscountCLP;

    const slaInfo = courier.slaHours[zone];
    const sla = slaInfo ? slaInfo.label : '24 a 48 hrs';

    return {
      courier,
      volumetricWeightKg,
      billableWeightKg,
      calculatedRateCLP,
      pickupPointDiscountCLP,
      finalHomeRateCLP: calculatedRateCLP,
      finalPickupRateCLP,
      sla,
      isAvailableInZone: true,
      isCheapest: false,
      isFastest: false
    };
  });

  // Determinar el más barato y el más rápido entre los disponibles
  const available = results.filter((r) => r.isAvailableInZone);
  if (available.length > 0) {
    let minRate = Infinity;
    let cheapestIdx = -1;

    let minSlaMin = Infinity;
    let fastestIdx = -1;

    available.forEach((r, idx) => {
      if (r.finalHomeRateCLP < minRate) {
        minRate = r.finalHomeRateCLP;
        cheapestIdx = idx;
      }

      const slaInfo = r.courier.slaHours[zone];
      if (slaInfo && slaInfo.min < minSlaMin) {
        minSlaMin = slaInfo.min;
        fastestIdx = idx;
      }
    });

    if (cheapestIdx !== -1) {
      available[cheapestIdx].isCheapest = true;
    }
    if (fastestIdx !== -1) {
      available[fastestIdx].isFastest = true;
    }
  }

  return results;
}

// ==========================================
// 4. Calculadora de Unit Economics: In-House vs 3PL
// ==========================================

export const FulfillmentParamsSchema = z.object({
  monthlyOrders: z.number().min(10).max(50000),
  productSalePriceCLP: z.number().min(1000),
  // Insumos de empaque (caja kraft, cinta kraft reforzada, etiqueta térmica, relleno)
  boxCostCLP: z.number().min(0),
  tapeAndFillCostCLP: z.number().min(0),
  labelThermalCostCLP: z.number().min(0),
  // In-House
  warehouseMonthlyRentCLP: z.number().min(0),
  warehouseUtilityBillsCLP: z.number().min(0),
  warehouseStaffMonthlyCLP: z.number().min(0),
  inHouseFreightAvgCLP: z.number().min(0),
  // 3PL
  tplStorageMonthlyPalletCLP: z.number().min(0),
  tplPalletsNeeded: z.number().min(1),
  tplPickAndPackFeePerOrderCLP: z.number().min(0),
  tplDiscountedFreightAvgCLP: z.number().min(0), // Couriers en 3PL suelen ser 10-15% más económicos por volumen
});

export type FulfillmentParams = z.infer<typeof FulfillmentParamsSchema>;

export interface FulfillmentComparisonResult {
  // Desglose In-House
  inHouse: {
    packagingTotalPerOrderCLP: number;
    fixedOverheadPerOrderCLP: number; // Arriendo + cuentas / pedidos
    laborPerOrderCLP: number; // Sueldos personal / pedidos
    freightPerOrderCLP: number;
    totalCostPerOrderCLP: number;
    totalMonthlyCostCLP: number;
    costPctOfSalePrice: number;
  };
  // Desglose 3PL
  tpl: {
    packagingTotalPerOrderCLP: number;
    storagePerOrderCLP: number; // Costo por pallet / pedidos
    pickAndPackFeeCLP: number;
    freightPerOrderCLP: number;
    totalCostPerOrderCLP: number;
    totalMonthlyCostCLP: number;
    costPctOfSalePrice: number;
  };
  // Análisis diferencial
  differencePerOrderCLP: number; // In-House - 3PL
  monthlySavingsCLP: number;
  winner: 'in_house' | 'tpl';
  breakevenOrdersVolume: number; // Volumen aproximado donde 3PL se vuelve más eficiente
  recommendation: string;
}

export function calculateFulfillmentComparison(
  params: FulfillmentParams
): FulfillmentComparisonResult {
  const p = FulfillmentParamsSchema.parse(params);

  // 1. Insumos
  const packagingPerOrder = p.boxCostCLP + p.tapeAndFillCostCLP + p.labelThermalCostCLP;

  // 2. In-House
  const inHouseFixedTotal = p.warehouseMonthlyRentCLP + p.warehouseUtilityBillsCLP;
  const inHouseFixedPerOrder = Math.round(inHouseFixedTotal / p.monthlyOrders);
  const inHouseLaborPerOrder = Math.round(p.warehouseStaffMonthlyCLP / p.monthlyOrders);
  const inHouseTotalPerOrder =
    packagingPerOrder + inHouseFixedPerOrder + inHouseLaborPerOrder + p.inHouseFreightAvgCLP;
  const inHouseTotalMonthly = inHouseTotalPerOrder * p.monthlyOrders;
  const inHousePct = Number(((inHouseTotalPerOrder / p.productSalePriceCLP) * 100).toFixed(1));

  // 3. 3PL
  const tplStorageTotal = p.tplStorageMonthlyPalletCLP * p.tplPalletsNeeded;
  const tplStoragePerOrder = Math.round(tplStorageTotal / p.monthlyOrders);
  const tplTotalPerOrder =
    packagingPerOrder + tplStoragePerOrder + p.tplPickAndPackFeePerOrderCLP + p.tplDiscountedFreightAvgCLP;
  const tplTotalMonthly = tplTotalPerOrder * p.monthlyOrders;
  const tplPct = Number(((tplTotalPerOrder / p.productSalePriceCLP) * 100).toFixed(1));

  // 4. Comparación
  const differencePerOrder = inHouseTotalPerOrder - tplTotalPerOrder;
  const monthlySavings = Math.abs(inHouseTotalMonthly - tplTotalMonthly);
  const winner = inHouseTotalPerOrder <= tplTotalPerOrder ? 'in_house' : 'tpl';

  // Umbral de corte estimado (donde los costos fijos de bodega y personal se amortizan)
  // inHouseFixed + inHouseLabor = tplStorage + (p.tplPickAndPackFeePerOrderCLP + tplFreightDiff)*orders
  const inHouseFixedAndLaborMonthly = inHouseFixedTotal + p.warehouseStaffMonthlyCLP;
  const tplVariableOverheadPerOrder = p.tplPickAndPackFeePerOrderCLP + (p.tplDiscountedFreightAvgCLP - p.inHouseFreightAvgCLP);
  
  let breakevenOrdersVolume = 450;
  if (tplVariableOverheadPerOrder > 0) {
    breakevenOrdersVolume = Math.round(inHouseFixedAndLaborMonthly / tplVariableOverheadPerOrder);
  }

  let recommendation = '';
  if (p.monthlyOrders < 350) {
    recommendation = 'Con menos de 350 pedidos/mes, una operación propia en oficina/garage o un 3PL flexible evita pagar bodegajes fijos elevados. Prioriza mantener costos fijos en cero.';
  } else if (winner === 'tpl') {
    recommendation = `A este nivel de volumen (${p.monthlyOrders} envíos/mes), tercerizar con un 3PL te ahorra ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(monthlySavings)} al mes en arriendos y contratos de personal, además de liberar tu tiempo para tráfico y producto.`;
  } else {
    recommendation = `Tu operación propia resulta más económica debido a la escala actual. Considera migrar a 3PL solo si los tiempos de preparación superan las 3 horas diarias del equipo fundador.`;
  }

  return {
    inHouse: {
      packagingTotalPerOrderCLP: packagingPerOrder,
      fixedOverheadPerOrderCLP: inHouseFixedPerOrder,
      laborPerOrderCLP: inHouseLaborPerOrder,
      freightPerOrderCLP: p.inHouseFreightAvgCLP,
      totalCostPerOrderCLP: inHouseTotalPerOrder,
      totalMonthlyCostCLP: inHouseTotalMonthly,
      costPctOfSalePrice: inHousePct
    },
    tpl: {
      packagingTotalPerOrderCLP: packagingPerOrder,
      storagePerOrderCLP: tplStoragePerOrder,
      pickAndPackFeeCLP: p.tplPickAndPackFeePerOrderCLP,
      freightPerOrderCLP: p.tplDiscountedFreightAvgCLP,
      totalCostPerOrderCLP: tplTotalPerOrder,
      totalMonthlyCostCLP: tplTotalMonthly,
      costPctOfSalePrice: tplPct
    },
    differencePerOrderCLP: differencePerOrder,
    monthlySavingsCLP: monthlySavings,
    winner,
    breakevenOrdersVolume: Math.max(100, Math.min(2500, breakevenOrdersVolume)),
    recommendation
  };
}

// ==========================================
// 5. Generador de Payloads JSON y Arquitectura de Webhooks
// ==========================================

export type WebhookState =
  | 'ORDER_CREATED'
  | 'LABEL_GENERATED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELIVERY_FAILED_RETRY';

export interface ShipmentEventMock {
  state: WebhookState;
  title: string;
  stepNumber: number;
  description: string;
  nextStepAction: string;
  payload: Record<string, unknown>;
}

export function getShipmentEventSequence(orderId: string = 'CL-2026-8812'): ShipmentEventMock[] {
  return [
    {
      state: 'ORDER_CREATED',
      stepNumber: 1,
      title: '1. Pedido Creado en Tienda (Checkout)',
      description: 'El cliente finaliza el pago en Webpay/Mercado Pago. La orden se registra con dirección validada en Chile.',
      nextStepAction: 'El sistema envía el payload a la API del Courier para cotizar y reservar servicio.',
      payload: {
        event: 'order.created',
        timestamp: '2026-09-15T14:30:00Z',
        order_id: orderId,
        store: 'Aura Market Chile',
        customer: {
          first_name: 'Camila',
          last_name: 'Vergara',
          email: 'camila.vergara@gmail.com',
          phone: '+56987654321',
          rut: '18.432.109-K'
        },
        shipping_address: {
          street: 'Av. Providencia',
          number: '1208',
          apartment: 'Depto 602',
          comuna: 'Providencia',
          city: 'Santiago',
          region: 'Metropolitana',
          country_code: 'CL',
          zip_code: '7500000'
        },
        items: [
          {
            sku: 'PET-FOUNTAIN-01',
            title: 'Fuente de Agua Silenciosa para Mascotas 2L',
            quantity: 1,
            unit_price_clp: 32990,
            weight_kg: 0.85
          }
        ],
        shipping_method: 'Blue Express Express Domicilio',
        subtotal_clp: 32990,
        shipping_fee_clp: 2990,
        total_clp: 35980
      }
    },
    {
      state: 'LABEL_GENERATED',
      stepNumber: 2,
      title: '2. Etiqueta Generada & Número de Tracking',
      description: 'La API del courier asigna el número de seguimiento único y genera el PDF/ZPL para imprimir en la impresora térmica.',
      nextStepAction: 'Se imprime la etiqueta, se pega al paquete y se entrega al transportista o punto PUDO.',
      payload: {
        event: 'shipment.label_created',
        timestamp: '2026-09-15T15:05:22Z',
        order_id: orderId,
        courier: 'blue_express',
        tracking_number: 'BX-CL-994821034',
        label_url: 'https://api.bluex.cl/v2/labels/BX-CL-994821034.pdf',
        service_type: 'DOMICILIO_ESTANDAR',
        declared_weight_kg: 0.95,
        package_dimensions_cm: { length: 22, width: 18, height: 14 },
        manifest_id: 'MAN-2026-0915-01'
      }
    },
    {
      state: 'IN_TRANSIT',
      stepNumber: 3,
      title: '3. En Tránsito (Hub Logístico)',
      description: 'El paquete es recepcionado en el Centro de Distribución Central (ej: CD Blue Express en Pudahuel) y clasificado en cinta transportadora.',
      nextStepAction: 'El webhook notifica al cliente por WhatsApp / SMS: "Tu pedido está en camino".',
      payload: {
        event: 'tracking.in_transit',
        timestamp: '2026-09-16T04:12:00Z',
        tracking_number: 'BX-CL-994821034',
        order_id: orderId,
        current_location: 'Centro de Distribución Pudahuel, Santiago',
        status_code: 'IN_TRANSIT_HUB',
        estimated_delivery_date: '2026-09-16'
      }
    },
    {
      state: 'OUT_FOR_DELIVERY',
      stepNumber: 4,
      title: '4. En Ruta de Entrega (Última Milla)',
      description: 'El bulto fue cargado en la furgoneta del repartidor de la zona local para ser entregado durante el día.',
      nextStepAction: 'Se envía alerta final al cliente: "El repartidor llegará hoy entre 09:00 y 19:00 hrs".',
      payload: {
        event: 'tracking.out_for_delivery',
        timestamp: '2026-09-16T08:45:10Z',
        tracking_number: 'BX-CL-994821034',
        order_id: orderId,
        driver_name: 'Rodrigo Morales',
        route_sector: 'Providencia / El Golf',
        attempt_number: 1,
        max_attempts: 2
      }
    },
    {
      state: 'DELIVERED',
      stepNumber: 5,
      title: '5. Entregado con Éxito (POD)',
      description: 'Recepción conforme con firma digital o foto del paquete entregado en conserjería / puerta (Proof of Delivery).',
      nextStepAction: 'Se cierra la orden, se envía encuesta de satisfacción y se gatilla secuencia de recompra a los 14 días.',
      payload: {
        event: 'tracking.delivered',
        timestamp: '2026-09-16T12:20:45Z',
        tracking_number: 'BX-CL-994821034',
        order_id: orderId,
        status: 'DELIVERED',
        received_by: {
          name: 'Manuel Soto (Conserjería)',
          rut: '12.871.204-5',
          pod_photo_url: 'https://cdn.courier.cl/pod/bx-994821034-proof.jpg'
        },
        delivery_duration_hours: 21.8
      }
    },
    {
      state: 'DELIVERY_FAILED_RETRY',
      stepNumber: 6,
      title: 'Incidencia / Morador Ausente (Reintento)',
      description: 'El repartidor no encontró moradores ni conserjería habilitada. Se reprograma segundo intento o se deriva a Punto PUDO.',
      nextStepAction: 'Webhook gatilla mensaje automático para solicitar instrucciones de entrega al comprador.',
      payload: {
        event: 'tracking.delivery_failed',
        timestamp: '2026-09-16T13:40:00Z',
        tracking_number: 'BX-CL-994821034',
        order_id: orderId,
        reason: 'MORADOR_AUSENTE',
        attempt_number: 1,
        next_attempt_date: '2026-09-17',
        resolution_options: ['RETRY_HOME', 'FORWARD_TO_LOCKER_PUDO']
      }
    }
  ];
}

/**
 * Código de ejemplo de Route Handler en Next.js (App Router) para recibir Webhooks de Couriers
 */
export const SAMPLE_ROUTE_HANDLER_CODE = `// app/api/webhooks/courier/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CourierWebhookPayloadSchema = z.object({
  event: z.string(),
  tracking_number: z.string(),
  order_id: z.string(),
  timestamp: z.string(),
  status_code: z.string().optional(),
  received_by: z.object({
    name: z.string(),
    rut: z.string().optional(),
  }).optional()
});

export async function POST(req: NextRequest) {
  try {
    // 1. Verificación de firma secreta del courier (HMAC SHA-256)
    const signature = req.headers.get('x-courier-signature');
    if (!signature && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Firma ausente' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = CourierWebhookPayloadSchema.parse(body);

    console.log(\`[Courier Webhook] \${validatedData.event} para Orden \${validatedData.order_id}\`);

    // 2. Actualizar estado en base de datos (Supabase / Prisma / Firestore)
    // await updateOrderStatus(validatedData.order_id, validatedData.event);

    // 3. Notificar al cliente si fue entregado
    if (validatedData.event === 'tracking.delivered') {
      // await sendWhatsAppDeliveryConfirmation(validatedData.order_id);
    }

    return NextResponse.json({ received: true, status: 'ok' });
  } catch (err: unknown) {
    console.error('Error procesando webhook:', err);
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }
}
`;
