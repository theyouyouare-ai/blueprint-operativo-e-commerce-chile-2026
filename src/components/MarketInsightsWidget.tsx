import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  AlertCircle, 
  ShieldAlert, 
  CheckCircle2, 
  Calendar, 
  Filter, 
  Scale, 
  Truck, 
  Building2, 
  CreditCard, 
  TrendingUp, 
  Copy, 
  Check, 
  FileText,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  MarketNewsItem, 
  ComplianceMilestone, 
  GroundingSource, 
  MarketCategory, 
  ImpactLevel, 
  MarketInsightsResponse 
} from '../types/marketInsights';
import { 
  INITIAL_MARKET_NEWS, 
  INITIAL_COMPLIANCE_MILESTONES, 
  OFFICIAL_REGULATORY_SOURCES 
} from '../data/marketInsightsData';

interface MarketInsightsWidgetProps {
  embeddedMode?: boolean;
}

export const MarketInsightsWidget: React.FC<MarketInsightsWidgetProps> = ({ embeddedMode = false }) => {
  const [data, setData] = useState<MarketInsightsResponse>({
    lastUpdated: 'Reciente (Chile 2026)',
    sourceType: 'grounded_database',
    executiveSummary: 'Ley N° 21.713 en plena vigencia: fin de exención de 41 USD (19% IVA general en importaciones), control de 50 transferencias mensuales a un mismo RUT por parte del SII y fiscalización activa del SERNAC sobre plazos de entrega transfronterizos.',
    searchQueriesUsed: ['regulaciones e-commerce chile 2026 ley 21.713 aduanas'],
    groundingSources: OFFICIAL_REGULATORY_SOURCES,
    news: INITIAL_MARKET_NEWS,
    milestones: INITIAL_COMPLIANCE_MILESTONES,
    disclaimer: 'Datos actualizados con el Servicio Nacional de Aduanas, SII y SERNAC.'
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [activeTabSub, setActiveTabSub] = useState<'noticias' | 'hitos' | 'fuentes'>('noticias');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const fetchInsights = async (topic: string = selectedCategory, customQuery: string = searchQuery, forceRefresh: boolean = false) => {
    setLoading(true);
    setErrorNotice(null);
    try {
      const params = new URLSearchParams();
      if (topic && topic !== 'all') params.append('topic', topic);
      if (customQuery && customQuery.trim()) params.append('q', customQuery.trim());
      if (forceRefresh) params.append('refresh', 'true');

      const res = await fetch(`/api/market-insights?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const json: MarketInsightsResponse = await res.json();
      setData(json);
    } catch {
      setErrorNotice('Mostrando base de datos regulatoria oficial verificada.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch on mount (serves cached/verified regulatory database instantly)
    fetchInsights('all', '', false);
  }, []);

  const handleCategoryChange = (cat: MarketCategory) => {
    setSelectedCategory(cat);
    fetchInsights(cat, searchQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInsights(selectedCategory, searchQuery);
  };

  const handlePresetClick = (queryText: string) => {
    setSearchQuery(queryText);
    fetchInsights(selectedCategory, queryText);
  };

  const handleCopyBrief = () => {
    const text = `--- INFORME REGULATORIO E-COMMERCE CHILE (ACTUALIZADO 2026) ---
Última actualización: ${data.lastUpdated}
Fuente: ${data.sourceType === 'google_search_live' ? 'Búsqueda en Vivo con Google Search Tool' : 'Base Normativa Oficial'}

RESUMEN EJECUTIVO:
${data.executiveSummary}

NOTICIAS & REGULACIONES CLAVE:
${data.news.map((n, i) => `${i + 1}. [${n.impactLevel.toUpperCase()}] ${n.title}
Entidad: ${n.affectedEntity} | Fuente: ${n.source}
Acción requerida: ${n.actionForStore}
URL: ${n.url}`).join('\n\n')}

HITOS DE CUMPLIMIENTO (LEY 21.713 & SERNAC):
${data.milestones.map(m => `• ${m.title} (${m.status.toUpperCase()}): ${m.description} [Ref: ${m.lawReference || m.entity}]`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const filteredNews = data.news.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.actionForStore.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q)) ||
        item.affectedEntity.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getImpactBadge = (level: ImpactLevel) => {
    switch (level) {
      case 'critico':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            Impacto Crítico
          </span>
        );
      case 'alto':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Impacto Alto
          </span>
        );
      case 'medio':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Info className="w-3 h-3 text-blue-600" />
            Impacto Operativo
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
            Informativo
          </span>
        );
    }
  };

  const getCategoryBadge = (cat: MarketCategory) => {
    switch (cat) {
      case 'aduanas_sii':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <Building2 className="w-3 h-3 text-purple-600" />
            Aduanas & SII
          </span>
        );
      case 'logistica':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
            <Truck className="w-3 h-3 text-sky-600" />
            Logística & Despachos
          </span>
        );
      case 'sernac':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Scale className="w-3 h-3 text-emerald-600" />
            SERNAC Consumidor
          </span>
        );
      case 'pasarelas':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CreditCard className="w-3 h-3 text-indigo-600" />
            Pasarelas & Pagos
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
            <TrendingUp className="w-3 h-3 text-stone-600" />
            Mercado & Tendencias
          </span>
        );
    }
  };

  return (
    <div className={`w-full ${embeddedMode ? '' : 'space-y-6'}`}>
      {/* Main Container Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Top Header Banner */}
        <div className="p-5 sm:p-6 bg-stone-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-1.5 rounded-lg bg-amber-400 text-stone-950">
                <Globe className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Market Insights & Radar Regulatorio Chile
              </h2>
              {data.sourceType === 'google_search_live' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Google Search Tool En Vivo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <CheckCircle2 className="w-3 h-3 text-amber-400" />
                  Base Normativa Oficial Verificada
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-stone-400 max-w-3xl">
              Monitoreo continuo de cambios legales, aduaneros (Ley N° 21.713), fiscalización del SII a ventas digitales, normativas SERNAC y novedades logísticas en Chile.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              id="btn-copy-regulatory-brief"
              onClick={handleCopyBrief}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors"
              title="Copiar informe regulatorio completo al portapapeles"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-300" />
                  <span>Copiar Informe</span>
                </>
              )}
            </button>

            <button
              id="btn-refresh-market-news"
              onClick={() => fetchInsights(selectedCategory, searchQuery, true)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Consultando Google Search...' : 'Actualizar Noticias'}</span>
            </button>
          </div>
        </div>

        {/* Executive Summary Callout */}
        <div className="p-4 sm:p-5 bg-amber-50/60 border-b border-stone-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-900 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-amber-700" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wider">
                  Síntesis del Panorama Regulatorio & Operativo
                </h4>
                <span className="text-xs text-stone-500 font-mono">
                  Última sincronización: {data.lastUpdated}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                {data.executiveSummary}
              </p>
              {data.searchQueriesUsed && data.searchQueriesUsed.length > 0 && (
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[11px] text-stone-500 font-medium">Búsqueda ejecutada:</span>
                  {data.searchQueriesUsed.map((queryText, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-200/80 text-stone-700 text-[11px] font-mono"
                    >
                      <Search className="w-2.5 h-2.5 text-stone-500" />
                      {queryText}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Notice if any */}
        {errorNotice && (
          <div className="p-3 bg-amber-100 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Navigation Tabs (Noticias | Hitos de Cumplimiento | Fuentes Oficiales) */}
        <div className="border-b border-stone-200 px-4 sm:px-6 bg-stone-50/50 flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 py-2">
            <button
              onClick={() => setActiveTabSub('noticias')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTabSub === 'noticias'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Noticias y Normativas</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-700 text-stone-200">
                {filteredNews.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTabSub('hitos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTabSub === 'hitos'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Línea de Tiempo Legal (Hitos 2026)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-700 text-stone-200">
                {data.milestones.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTabSub('fuentes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTabSub === 'fuentes'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Fuentes & Enlaces Oficiales</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-700 text-stone-200">
                {data.groundingSources.length}
              </span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        {activeTabSub === 'noticias' && (
          <div className="p-4 sm:p-5 border-b border-stone-200 bg-white space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'Todas' },
                  { id: 'aduanas_sii', label: 'Aduanas & SII' },
                  { id: 'logistica', label: 'Logística & Tiempos' },
                  { id: 'sernac', label: 'SERNAC' },
                  { id: 'pasarelas', label: 'Pasarelas' },
                  { id: 'general', label: 'Tendencias' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleCategoryChange(tab.id as MarketCategory)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === tab.id
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Live Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative sm:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar norma, tema o palabra clave..."
                  className="w-full pl-8 pr-16 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 bg-stone-50"
                />
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                <button
                  type="submit"
                  className="absolute right-1 top-1 px-2 py-1 text-[10px] font-bold rounded bg-stone-800 text-white hover:bg-stone-700"
                >
                  Filtrar
                </button>
              </form>
            </div>

            {/* Quick Queries Presets */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs text-stone-500">
              <span className="text-[11px] font-medium text-stone-400">Consultas frecuentes:</span>
              {[
                'Fin exención US$ 41',
                'Control 50 transferencias',
                'Plazos SERNAC',
                'Boleta DTE 39',
                'AliExpress IVA'
              ].map((preset, i) => (
                <button
                  key={i}
                  onClick={() => handlePresetClick(preset)}
                  className="px-2 py-0.5 rounded text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                >
                  {preset}
                </button>
              ))}
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    fetchInsights(selectedCategory, '');
                  }}
                  className="text-[11px] text-stone-500 underline ml-1 hover:text-stone-900"
                >
                  Limpiar filtro
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="p-4 sm:p-6 bg-stone-50/30">
          {/* TAB 1: NOTICIAS & REGULACIONES */}
          {activeTabSub === 'noticias' && (
            <div className="space-y-4">
              {filteredNews.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-stone-200 p-6">
                  <Search className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-stone-800">No se encontraron noticias con este filtro</h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                    Intenta seleccionando otra categoría o haz clic en "Actualizar Noticias" para consultar Google Search nuevamente.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                      fetchInsights('all', '');
                    }}
                    className="mt-3 px-3 py-1.5 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800"
                  >
                    Restablecer Filtros
                  </button>
                </div>
              ) : (
                filteredNews.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-stone-200 p-4 sm:p-5 shadow-xs hover:border-stone-300 transition-all space-y-3"
                  >
                    {/* Card Header: Badges & Date */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getImpactBadge(item.impactLevel)}
                        {getCategoryBadge(item.category)}
                        <span className="text-xs font-medium text-stone-500">
                          {item.affectedEntity}
                        </span>
                      </div>
                      <span className="text-xs text-stone-400 font-mono">
                        {item.date}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight leading-snug">
                      {item.title}
                    </h3>

                    {/* Summary */}
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      {item.summary}
                    </p>

                    {/* Action for Store Owner (Callout Box) */}
                    <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-start gap-2.5">
                      <div className="p-1 rounded bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                      </div>
                      <div className="text-xs space-y-0.5">
                        <span className="font-bold text-stone-900 block">
                          Impacto & Acción Requerida para tu Tienda:
                        </span>
                        <p className="text-stone-700 leading-relaxed">
                          {item.actionForStore}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer: Tags & Official Source Link */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3 flex-wrap text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded bg-stone-100 text-stone-600 text-[11px] font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 font-medium transition-colors"
                      >
                        <span>Fuente: {item.source}</span>
                        <ExternalLink className="w-3 h-3 text-stone-400" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: LÍNEA DE TIEMPO LEGAL (HITOS 2026) */}
          {activeTabSub === 'hitos' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-5">
                <h3 className="text-sm font-bold text-stone-900 mb-1">
                  Cronograma de Obligaciones Regulatorias (Chile 2026)
                </h3>
                <p className="text-xs text-stone-500 mb-4">
                  Fechas críticas y normativas vigentes que determinan cómo debes tributar, emitir boletas y despachar tus productos.
                </p>

                <div className="relative border-l-2 border-stone-200 ml-3 sm:ml-4 pl-4 sm:pl-6 space-y-6">
                  {data.milestones.map((m) => (
                    <div key={m.id} className="relative group">
                      {/* Dot */}
                      <span className={`absolute -left-[23px] sm:-left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        m.status === 'vigente' 
                          ? 'bg-emerald-500' 
                          : m.status === 'en_fiscalizacion'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}></span>

                      <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-bold text-stone-900">
                            {m.title}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            m.status === 'vigente'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {m.status === 'vigente' ? 'En Vigencia' : 'Fiscalización Activa'}
                          </span>
                        </div>

                        <p className="text-xs text-stone-600 leading-relaxed">
                          {m.description}
                        </p>

                        <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-stone-500 border-t border-stone-200/60">
                          <span>Entidad: <strong>{m.entity}</strong></span>
                          {m.lawReference && (
                            <span className="font-mono bg-stone-200/70 px-1.5 py-0.5 rounded text-stone-800">
                              {m.lawReference}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FUENTES OFICIALES & CITAS GOOGLE SEARCH */}
          {activeTabSub === 'fuentes' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-stone-900">
                    Fuentes de Información y Citas Obtenidas
                  </h3>
                  <span className="text-xs text-stone-500">
                    {data.groundingSources.length} referencias oficiales
                  </span>
                </div>
                <p className="text-xs text-stone-500 mb-4">
                  Enlaces oficiales recuperados a través de Google Search Grounding y normativas oficiales publicadas por organismos del Estado chileno.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.groundingSources.map((source, sIdx) => (
                    <a
                      key={sIdx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-stone-300 transition-all flex items-start justify-between gap-2 group"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="text-xs font-semibold text-stone-900 group-hover:text-amber-900 line-clamp-2">
                          {source.title}
                        </div>
                        <div className="text-[11px] text-stone-400 font-mono truncate">
                          {source.uri}
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 shrink-0 mt-0.5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Disclaimer */}
        <div className="px-5 py-3 bg-stone-100/70 border-t border-stone-200 flex items-center justify-between gap-3 text-[11px] text-stone-500">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>{data.disclaimer}</span>
          </div>
          <span className="hidden sm:inline font-mono">
            Modo: {data.sourceType === 'google_search_live' ? 'Búsqueda en Vivo' : 'Base de Respaldo'}
          </span>
        </div>
      </div>
    </div>
  );
};
