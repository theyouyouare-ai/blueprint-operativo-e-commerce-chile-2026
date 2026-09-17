import { LandedCostInput, LandedCostResult } from '../types/blueprint';

export function calculateLandedCost(
  input: LandedCostInput,
  exchangeRate: number
): LandedCostResult {
  const {
    supplierCostUSD,
    shippingCostUSD,
    salePriceCLP,
    gatewayType,
    adCpaCLP,
    returnRatePct = 3
  } = input;

  // CIF = Cost, Insurance, Freight (Subtotal)
  const cifUSD = supplierCostUSD + shippingCostUSD;

  // Ley 21.713: 19% IVA on ALL imports without the USD 41 exemption
  const iva19USD = cifUSD * 0.19;

  // Landed Cost USD and in Chilean Pesos (CLP)
  const landedCostUSD = cifUSD + iva19USD;
  const landedCostCLP = Math.round(landedCostUSD * exchangeRate);

  // Gross profit & margin
  const grossProfitCLP = salePriceCLP - landedCostCLP;
  const grossMarginPct = salePriceCLP > 0 ? (grossProfitCLP / salePriceCLP) * 100 : 0;

  // Payment gateway commission rates (including 19% IVA on commission)
  // Webpay Plus Débito: 1.75% + IVA = ~2.08%
  // Webpay Plus Crédito: 2.35% + IVA = ~2.80%
  // Mercado Pago: 3.09% + IVA = ~3.68%
  // Flow: 3.04% + IVA = ~3.62%
  let gatewayRatePct = 2.08;
  if (gatewayType === 'webpay_credit') {
    gatewayRatePct = 2.35 * 1.19; // ~2.7965%
  } else if (gatewayType === 'mercadopago') {
    gatewayRatePct = 3.09 * 1.19; // ~3.677%
  } else if (gatewayType === 'flow') {
    gatewayRatePct = 3.04 * 1.19; // ~3.618%
  } else {
    gatewayRatePct = 1.75 * 1.19; // ~2.0825%
  }

  const gatewayFeeCLP = Math.round(salePriceCLP * (gatewayRatePct / 100));

  // Breakeven ROAS: 1 / (gross margin as fraction)
  const grossMarginDecimal = grossMarginPct / 100;
  const breakevenRoas = grossMarginDecimal > 0 ? 1 / grossMarginDecimal : 0;
  
  // Benchmark Target ROAS: ~2.2x as noted in blueprint to achieve 20-25% net margin
  const suggestedTargetRoas = Math.max(2.2, Number((breakevenRoas * 1.25).toFixed(2)));

  // Ad CPA: if user entered custom adCpaCLP, use it; otherwise compute from target ROAS
  const calculatedAdCpaCLP = adCpaCLP && adCpaCLP > 0
    ? adCpaCLP
    : Math.round(salePriceCLP / suggestedTargetRoas);

  // Return reserve (3% default)
  const returnReserveCLP = Math.round(salePriceCLP * (returnRatePct / 100));

  // Net Profit in CLP
  const netProfitCLP = grossProfitCLP - gatewayFeeCLP - calculatedAdCpaCLP - returnReserveCLP;
  const netMarginPct = salePriceCLP > 0 ? (netProfitCLP / salePriceCLP) * 100 : 0;

  // SII Formulario 29 VAT Accounting (F29):
  // Débito fiscal IVA = 19% included in final retail sale price (PVP * 19/119)
  const ivaF29DebitCLP = Math.round(salePriceCLP * (19 / 119));
  // Crédito fiscal IVA = IVA already paid on import via Ley 21.713 + IVA on gateway fee
  const ivaF29CreditCLP = Math.round((iva19USD * exchangeRate) + (gatewayFeeCLP * (19 / 119)));
  const f29BalanceCLP = Math.max(0, ivaF29DebitCLP - ivaF29CreditCLP);

  return {
    cifUSD: Number(cifUSD.toFixed(2)),
    iva19USD: Number(iva19USD.toFixed(2)),
    landedCostUSD: Number(landedCostUSD.toFixed(2)),
    landedCostCLP,
    salePriceCLP,
    grossProfitCLP,
    grossMarginPct: Number(grossMarginPct.toFixed(1)),
    gatewayFeePct: Number(gatewayRatePct.toFixed(2)),
    gatewayFeeCLP,
    breakevenRoas: Number(breakevenRoas.toFixed(2)),
    suggestedTargetRoas,
    suggestedAdCpaCLP: calculatedAdCpaCLP,
    netProfitCLP,
    netMarginPct: Number(netMarginPct.toFixed(1)),
    ivaF29CreditCLP,
    ivaF29DebitCLP,
    f29BalanceCLP
  };
}

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  }).format(amount);
}
