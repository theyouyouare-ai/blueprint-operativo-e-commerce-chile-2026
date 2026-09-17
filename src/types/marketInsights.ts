export type MarketCategory = 'all' | 'aduanas_sii' | 'logistica' | 'sernac' | 'pasarelas' | 'general';

export type ImpactLevel = 'critico' | 'alto' | 'medio' | 'informativo';

export interface MarketNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  date: string;
  category: MarketCategory;
  impactLevel: ImpactLevel;
  affectedEntity: string;
  actionForStore: string;
  tags: string[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ComplianceMilestone {
  id: string;
  title: string;
  dateOrDeadline: string;
  description: string;
  entity: string;
  status: 'vigente' | 'proxima' | 'en_fiscalizacion';
  lawReference?: string;
}

export interface MarketInsightsResponse {
  lastUpdated: string;
  sourceType: 'google_search_live' | 'grounded_database';
  executiveSummary: string;
  searchQueriesUsed?: string[];
  groundingSources: GroundingSource[];
  news: MarketNewsItem[];
  milestones: ComplianceMilestone[];
  disclaimer?: string;
}
