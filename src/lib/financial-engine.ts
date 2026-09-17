/**
 * Motor Financiero y Unit Economics - E-commerce Chile 2026
 * Aplica estrictamente la normativa fiscal chilena:
 * - Ley N° 21.713 (Cumplimiento Tributario): 19% IVA en todas las importaciones sin exención de US$ 41
 * - Arancel aduanero general del 6% (aplicable si CIF > US$ 500 o regímenes no acogidos a TLC)
 * - Retención y comisiones de pasarelas locales (Webpay Plus / Mercado Pago ~3.51% a 3.80% con IVA)
 * - Tasa de cambio de referencia: USD 1 = CLP 940
 */

export type AcquisitionChannel = 'meta_ads' | 'tiktok_ads' | 'google_shopping' | 'organico';

export interface ChannelBenchmark {
  id: AcquisitionChannel;
  name: string;
  recommendedCAC_CLP: number;
  cpcAverageCLP: number;
  expectedConversionRatePct: number;
  description: string;
}

export const ACQUISITION_CHANNELS: Record<AcquisitionChannel, ChannelBenchmark> = {
  tiktok_ads: {
    id: 'tiktok_ads',
    name: 'TikTok Ads (Spark / UGC)',
    recommendedCAC_CLP: 3800,
    cpcAverageCLP: 180,
    expectedConversionRatePct: 2.1,
    description: 'Excelente para productos visuales de impulso (Mascotas, Belleza). Menor CPC pero requiere rotación semanal de creativos.'
  },
  meta_ads: {
    id: 'meta_ads',
    name: 'Meta Ads (Instagram / Facebook)',
    recommendedCAC_CLP: 4500,
    cpcAverageCLP: 320,
    expectedConversionRatePct: 2.4,
    description: 'Canal más estable y con mayor poder de compra en Chile. Algoritmo Advantage+ optimizado para conversión a compra.'
  },
  google_shopping: {
    id: 'google_shopping',
    name: 'Google Shopping / PMax',
    recommendedCAC_CLP: 6200,
    cpcAverageCLP: 450,
    expectedConversionRatePct: 3.2,
    description: 'Tráfico de alta intención de compra directa. Ideal para Gadgets y Hogar con tickets promedio superiores a $35.000 CLP.'
  },
  organico: {
    id: 'organico',
    name: 'Tráfico Orgánico / KOLs',
    recommendedCAC_CLP: 800,
    cpcAverageCLP: 0,
    expectedConversionRatePct: 3.5,
    description: 'Canje con micro-influencers chilenos o contenido orgánico en TikTok. Mínimo costo de adquisición pero escalamiento lento.'
  }
};

export interface LandedCostBreakdown {
  supplierCostUSD: number;
  shippingCostUSD: number;
  cifUSD: number;
  cifCLP: number;
  tariffRatePct: number;
  tariffCLP: number;
  ivaRatePct: number;
  ivaImportCLP: number;
  localDeliveryCLP: number;
  totalLandedCLP: number;
  landedCostUSD: number;
}

export interface UnitEconomicsInput {
  supplierCostUSD: number;
  shippingCostUSD: number;
  localDeliveryCLP?: number;
  adChannel?: AcquisitionChannel;
  customCacCLP?: number;
  targetNetMarginPct?: number; // default 22%
  gatewayFeePct?: number; // default 3.51%
  exchangeRate?: number; // default 940
  manualPvpCLP?: number;
  fixedCostsMonthlyCLP?: number; // default 1.000.000 CLP
}

export interface UnitEconomicsOutput {
  landed: LandedCostBreakdown;
  cacCLP: number;
  gatewayFeePct: number;
  suggestedPvpCLP: number;
  effectivePvpCLP: number;
  gatewayFeeCLP: number;
  grossProfitCLP: number;
  grossMarginPct: number;
  netProfitCLP: number;
  netMarginPct: number;
  breakevenRoas: number;
  targetRoas: number;
  fixedCostsMonthlyCLP: number;
  breakevenUnitsMonthly: number;
  monthlyTargetRevenueCLP: number;
  scenarios: Array<{
    units: number;
    revenueCLP: number;
    cogsAndShippingCLP: number;
    adSpendCLP: number;
    gatewayFeesCLP: number;
    fixedCostsCLP: number;
    netProfitCLP: number;
    status: 'perdida' | 'equilibrio' | 'ganancia';
  }>;
}

/**
 * Interfaz para entrada flexible de calculateLandedCost
 */
export interface LandedCostCalculationParams {
  supplierCostUSD: number;
  shippingCostUSD: number;
  localDeliveryCLP?: number;
  exchangeRate?: number;
  tariffRatePct?: number;
  applyTariff?: boolean;
}

export interface DetailedLandedCostResult extends LandedCostBreakdown {
  fobUSD: number;
  fleteUSD: number;
  iva19USD: number;
  landedCostCLP: number;
}

/**
 * Calcula el Costo Landed exacto puesto en Chile conforme a la Ley N° 21.713 y normativa Aduanera.
 * Soporta invocación directa (parámetros) o mediante objeto de configuración.
 */
export function calculateLandedCost(
  supplierCostUSDOrParams: number | LandedCostCalculationParams,
  shippingCostUSDParam?: number,
  localDeliveryCLPParam: number = 3800,
  exchangeRateParam: number = 940,
  tariffRatePctParam?: number
): DetailedLandedCostResult {
  let supplierCostUSD: number;
  let shippingCostUSD: number;
  let localDeliveryCLP: number;
  let exchangeRate: number;
  let customTariffRate: number | undefined;
  let forceTariff: boolean | undefined;

  if (typeof supplierCostUSDOrParams === 'object') {
    supplierCostUSD = supplierCostUSDOrParams.supplierCostUSD;
    shippingCostUSD = supplierCostUSDOrParams.shippingCostUSD;
    localDeliveryCLP = supplierCostUSDOrParams.localDeliveryCLP ?? 3800;
    exchangeRate = supplierCostUSDOrParams.exchangeRate ?? 940;
    customTariffRate = supplierCostUSDOrParams.tariffRatePct;
    forceTariff = supplierCostUSDOrParams.applyTariff;
  } else {
    supplierCostUSD = supplierCostUSDOrParams;
    shippingCostUSD = shippingCostUSDParam ?? 0;
    localDeliveryCLP = localDeliveryCLPParam;
    exchangeRate = exchangeRateParam;
    customTariffRate = tariffRatePctParam;
  }

  const safeSupplierUSD = Math.max(0, supplierCostUSD);
  const safeShippingUSD = Math.max(0, shippingCostUSD);
  const cifUSD = safeSupplierUSD + safeShippingUSD;
  const cifCLP = Math.round(cifUSD * exchangeRate);

  // Arancel Ad-Valorem general del 6% (Ley aduanera: aplica si CIF > US$ 500, o si se especifica)
  let tariffRatePct = 0;
  if (customTariffRate !== undefined) {
    tariffRatePct = customTariffRate;
  } else if (forceTariff !== undefined) {
    tariffRatePct = forceTariff ? 6 : 0;
  } else {
    tariffRatePct = cifUSD > 500 ? 6 : 0;
  }

  const tariffCLP = Math.round(cifCLP * (tariffRatePct / 100));

  // IVA de Importación del 19% (Ley N° 21.713 elimina exención US$ 41 sobre CIF + Arancel)
  const ivaBaseCLP = cifCLP + tariffCLP;
  const ivaRatePct = 19;
  const ivaImportCLP = Math.round(ivaBaseCLP * (ivaRatePct / 100));
  const iva19USD = Number((cifUSD * 0.19).toFixed(2));

  // Costo Landed en aduana (sin despacho de última milla) y Costo Total (con despacho local)
  const landedCostCLP = cifCLP + tariffCLP + ivaImportCLP;
  const totalLandedCLP = landedCostCLP + localDeliveryCLP;
  const landedCostUSD = Number((totalLandedCLP / exchangeRate).toFixed(2));

  return {
    supplierCostUSD: safeSupplierUSD,
    shippingCostUSD: safeShippingUSD,
    fobUSD: safeSupplierUSD,
    fleteUSD: safeShippingUSD,
    cifUSD: Number(cifUSD.toFixed(2)),
    cifCLP,
    tariffRatePct,
    tariffCLP,
    ivaRatePct,
    ivaImportCLP,
    iva19USD,
    localDeliveryCLP,
    landedCostCLP,
    totalLandedCLP,
    landedCostUSD
  };
}

/**
 * Alias de compatibilidad hacia calculateLandedCost
 */
export function calculateLandedCostChile(
  supplierCostUSD: number,
  shippingCostUSD: number,
  localDeliveryCLP: number = 3800,
  exchangeRate: number = 940
): LandedCostBreakdown {
  return calculateLandedCost(supplierCostUSD, shippingCostUSD, localDeliveryCLP, exchangeRate);
}

/**
 * Calcula el Precio de Venta al Público (PVP en CLP con IVA incluido)
 * que garantiza que el Margen Neto sea >= targetNetMarginPct tras absorber Costo Landed, CAC y Pasarelas de Pago.
 */
export function calculateSuggestedPVP(
  landedCostCLP: number,
  cacCLP: number,
  targetNetMarginPct: number = 22,
  gatewayFeePct: number = 3.51
): number {
  const marginDecimal = Math.max(0.05, Math.min(0.60, targetNetMarginPct / 100));
  const gatewayDecimal = gatewayFeePct / 100;
  const denominator = 1 - (marginDecimal + gatewayDecimal);

  if (denominator <= 0.1) {
    return Math.round((landedCostCLP + cacCLP) * 1.5);
  }

  const rawPVP = (landedCostCLP + cacCLP) / denominator;
  
  // Redondeo comercial a terminaciones comunes en Chile (ej. $X.990)
  let roundedThousands = Math.ceil(rawPVP / 1000) * 1000;
  let standardPvp = roundedThousands - 10; // ej: 24990, 32990, 49990

  // Garantizar matemáticamente que standardPvp >= rawPVP para que el Margen Neto sea >= targetNetMarginPct
  if (standardPvp < rawPVP) {
    standardPvp += 1000;
  }

  return Math.max(9990, standardPvp);
}

/**
 * Calcula la matriz completa de Unit Economics y el punto de equilibrio (Break-even).
 */
export function calculateUnitEconomics(input: UnitEconomicsInput): UnitEconomicsOutput {
  const exchangeRate = input.exchangeRate || 940;
  const localDelivery = input.localDeliveryCLP ?? 3800;
  const targetNetMargin = input.targetNetMarginPct ?? 22;
  const gatewayFeePct = input.gatewayFeePct ?? 3.51;
  const fixedCostsMonthlyCLP = input.fixedCostsMonthlyCLP ?? 1000000;

  // 1. Costo Landed
  const landed = calculateLandedCostChile(
    input.supplierCostUSD,
    input.shippingCostUSD,
    localDelivery,
    exchangeRate
  );

  // 2. CAC Proyectado
  const defaultChannel: AcquisitionChannel = input.adChannel || 'meta_ads';
  const cacCLP = input.customCacCLP ?? ACQUISITION_CHANNELS[defaultChannel].recommendedCAC_CLP;

  // 3. PVP Sugerido vs Manual
  const suggestedPvpCLP = calculateSuggestedPVP(
    landed.totalLandedCLP,
    cacCLP,
    targetNetMargin,
    gatewayFeePct
  );

  const effectivePvpCLP = input.manualPvpCLP && input.manualPvpCLP > 0
    ? input.manualPvpCLP
    : suggestedPvpCLP;

  // 4. Margen Bruto y Comisiones
  const gatewayFeeCLP = Math.round(effectivePvpCLP * (gatewayFeePct / 100));
  const grossProfitCLP = effectivePvpCLP - landed.totalLandedCLP;
  const grossMarginPct = effectivePvpCLP > 0 ? (grossProfitCLP / effectivePvpCLP) * 100 : 0;

  // 5. Margen Neto Unitario (EBITDA Operativo)
  const netProfitCLP = grossProfitCLP - cacCLP - gatewayFeeCLP;
  const netMarginPct = effectivePvpCLP > 0 ? (netProfitCLP / effectivePvpCLP) * 100 : 0;

  // 6. ROAS de Equilibrio y Objetivo
  // Breakeven ROAS = 1 / Margen Bruto Decimal
  const grossMarginDec = grossMarginPct / 100;
  const breakevenRoas = grossMarginDec > 0 ? Number((1 / grossMarginDec).toFixed(2)) : 2.5;
  const targetRoas = Number((breakevenRoas * 1.3).toFixed(2));

  // 7. Punto de Equilibrio en Unidades Mensuales
  // Margen de Contribución = PVP - Landed - Pasarela (el CAC variable ya está en el gasto publicitario)
  const unitContributionMargin = effectivePvpCLP - landed.totalLandedCLP - gatewayFeeCLP - cacCLP;
  const breakevenUnitsMonthly = unitContributionMargin > 0
    ? Math.ceil(fixedCostsMonthlyCLP / unitContributionMargin)
    : 999;

  const monthlyTargetRevenueCLP = breakevenUnitsMonthly * effectivePvpCLP;

  // 8. Escenarios de volumen mensual
  const scenarioVolume = [
    Math.max(1, Math.round(breakevenUnitsMonthly * 0.5)),
    breakevenUnitsMonthly,
    Math.round(breakevenUnitsMonthly * 1.5),
    Math.round(breakevenUnitsMonthly * 2.5),
    Math.round(breakevenUnitsMonthly * 4)
  ];

  const scenarios = scenarioVolume.map(units => {
    const revenueCLP = units * effectivePvpCLP;
    const cogsAndShippingCLP = units * landed.totalLandedCLP;
    const adSpendCLP = units * cacCLP;
    const gatewayFeesCLP = units * gatewayFeeCLP;
    const totalCosts = cogsAndShippingCLP + adSpendCLP + gatewayFeesCLP + fixedCostsMonthlyCLP;
    const scenarioNetProfitCLP = revenueCLP - totalCosts;

    let status: 'perdida' | 'equilibrio' | 'ganancia' = 'ganancia';
    if (scenarioNetProfitCLP < -1000) {
      status = 'perdida';
    } else if (Math.abs(scenarioNetProfitCLP) <= 1000) {
      status = 'equilibrio';
    }

    return {
      units,
      revenueCLP,
      cogsAndShippingCLP,
      adSpendCLP,
      gatewayFeesCLP,
      fixedCostsCLP: fixedCostsMonthlyCLP,
      netProfitCLP: scenarioNetProfitCLP,
      status
    };
  });

  return {
    landed,
    cacCLP,
    gatewayFeePct,
    suggestedPvpCLP,
    effectivePvpCLP,
    gatewayFeeCLP,
    grossProfitCLP,
    grossMarginPct: Number(grossMarginPct.toFixed(1)),
    netProfitCLP,
    netMarginPct: Number(netMarginPct.toFixed(1)),
    breakevenRoas,
    targetRoas,
    fixedCostsMonthlyCLP,
    breakevenUnitsMonthly,
    monthlyTargetRevenueCLP,
    scenarios
  };
}
