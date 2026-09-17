export interface AuditItem {
  id: number;
  originalAssumption: string;
  situation2026: string;
  impact: string;
  actionableFix: string;
  severity: 'critical' | 'high' | 'medium';
  category: 'Pasarelas' | 'Canales' | 'Algoritmos Meta' | 'Impuestos & Aduana' | 'Presupuesto Ads';
}

export interface NicheModel {
  id: string;
  name: string;
  badge: string;
  categoryKey?: 'mascotas' | 'belleza' | 'hogar' | 'tecnologia';
  whyWorks2026: string;
  entryProducts: string[];
  supplierCostUSD: number;
  shippingCostUSD: number;
  suggestedPvpCLP: number;
  demandDrivers: string[];
  searchVolumeMonthCL?: string;
  competitionLevel?: 'Baja' | 'Media' | 'Media-Alta' | 'Alta';
  marketAveragePriceCLP?: number;
  primaryChannel?: 'Meta Ads' | 'TikTok Ads' | 'Google Shopping';
  validationChecklist: {
    trendsTerm: string;
    meliCategory: string;
    competitorIntensity: string;
    customerPainPointsToSolve: string[];
  };
}

export interface LandedCostInput {
  supplierCostUSD: number;
  shippingCostUSD: number;
  salePriceCLP: number;
  gatewayType: 'webpay_debit' | 'webpay_credit' | 'mercadopago' | 'flow';
  adCpaCLP?: number; // Optional user estimated ad CPA
  returnRatePct?: number; // e.g., 3%
}

export interface LandedCostResult {
  cifUSD: number;
  iva19USD: number;
  landedCostUSD: number;
  landedCostCLP: number;
  salePriceCLP: number;
  grossProfitCLP: number;
  grossMarginPct: number;
  gatewayFeePct: number;
  gatewayFeeCLP: number;
  breakevenRoas: number;
  suggestedTargetRoas: number;
  suggestedAdCpaCLP: number;
  netProfitCLP: number;
  netMarginPct: number;
  ivaF29CreditCLP: number;
  ivaF29DebitCLP: number;
  f29BalanceCLP: number;
}

export interface PaymentGateway {
  id: string;
  name: string;
  category: string;
  commission: string;
  settlementTime: string;
  whenToUse: string;
  pros: string[];
  cons: string[];
  reliabilityScore: number;
}

export interface SprintDayItem {
  day: number;
  title: string;
  subtitle: string;
  timeEst: string;
  tasks: {
    id: string;
    text: string;
    detail: string;
    officialRef?: string;
  }[];
}

export interface UgcScriptTemplate {
  id: string;
  angle: string;
  timing: string;
  targetObjective: string;
  structure: {
    phase: string;
    timeSeconds: string;
    objective: string;
    scriptPrompt: string;
    visualAction: string;
  }[];
}
