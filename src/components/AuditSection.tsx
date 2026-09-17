import React, { useState } from 'react';
import { AUDIT_ITEMS } from '../data/blueprintData';
import { AlertTriangle, CheckCircle2, ArrowRight, ShieldAlert, Sparkles, Scale, DollarSign, TrendingUp, Info, Globe } from 'lucide-react';

interface AuditSectionProps {
  onNavigateToMarketInsights?: () => void;
}

export const AuditSection: React.FC<AuditSectionProps> = ({ onNavigateToMarketInsights }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const categories = ['all', 'Pasarelas', 'Canales', 'Algoritmos Meta', 'Impuestos & Aduana', 'Presupuesto Ads'];

  const filteredItems = selectedFilter === 'all'
    ? AUDIT_ITEMS
    : AUDIT_ITEMS.filter((item) => item.category === selectedFilter);

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-amber-100 rounded-xl text-amber-800 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                Auditoría del Plan Original: Qué Cambió en Septiembre 2026
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-200 text-amber-900">
                5 Supuestos Críticos Reevaluados
              </span>
            </div>
            <p className="text-sm text-stone-700 leading-relaxed">
              El plan base <span className="font-semibold text-stone-900">(Shopify/WooCommerce + DSers/CJ/Spocket/Zendrop + Webpay/Mercado Pago + TikTok/Meta Ads)</span> sigue siendo la arquitectura técnica correcta. Sin embargo, cinco supuestos de manuales tradicionales quedaron desactualizados y alteran directamente el <strong>margen landed (+19% por Ley 21.713)</strong>, la <strong>fricción de pasarelas</strong> y la <strong>asignación presupuestaria en Ads</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider shrink-0">
          Filtrar por área:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              selectedFilter === cat
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {cat === 'all' ? 'Ver Todos (5)' : cat}
          </button>
        ))}
      </div>

      {/* Comparative Cards Grid */}
      <div className="grid grid-cols-1 gap-5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden hover:border-stone-300 transition-all"
          >
            {/* Header of the Card */}
            <div className="px-5 py-3.5 bg-stone-50/80 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold font-mono">
                  #{item.id}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-200 text-stone-700">
                  {item.category}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-rose-700 font-medium bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Impacto en Margen & Ejecución</span>
              </div>
            </div>

            {/* Body Comparison */}
            <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Left: Old Assumption */}
              <div className="md:col-span-4 bg-stone-50 rounded-xl p-4 border border-stone-200/70">
                <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                  Supuesto del Plan Original
                </div>
                <p className="text-sm font-medium text-stone-700 leading-snug line-through decoration-rose-500/70 decoration-2">
                  {item.originalAssumption}
                </p>
                <div className="mt-3 text-xs text-rose-600 flex items-center gap-1 font-medium">
                  <span>❌ Desactualizado para 2026</span>
                </div>
              </div>

              {/* Middle: 2026 Reality */}
              <div className="md:col-span-4 bg-amber-50/60 rounded-xl p-4 border border-amber-200/60">
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                  Situación Real (Septiembre 2026)
                </div>
                <p className="text-sm font-semibold text-stone-900 leading-relaxed">
                  {item.situation2026}
                </p>
                <div className="mt-3 text-xs text-amber-900 bg-amber-100/80 px-2 py-1 rounded font-medium">
                  <strong>Efecto directo:</strong> {item.impact}
                </div>
              </div>

              {/* Right: Actionable Fix */}
              <div className="md:col-span-4 bg-emerald-50/70 rounded-xl p-4 border border-emerald-200/80">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Solución Operativa Exacta</span>
                </div>
                <p className="text-sm font-semibold text-emerald-950 leading-relaxed">
                  {item.actionableFix}
                </p>
                <div className="mt-3 text-xs text-emerald-800 font-medium">
                  ✔ Aplicado en los simuladores y checklists de esta herramienta
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Market Insights Banner */}
      {onNavigateToMarketInsights && (
        <div className="bg-gradient-to-r from-stone-900 to-stone-800 rounded-2xl p-5 sm:p-6 text-white border border-stone-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-400 text-stone-950">
                <Globe className="w-4 h-4" />
              </span>
              <h4 className="text-sm sm:text-base font-bold text-white">
                ¿Necesitas verificar las últimas noticias regulatorias y aduaneras en vivo?
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Consulta nuestro <strong>Market Insights Widget</strong> con búsqueda en tiempo real mediante la herramienta Google Search para seguir circulares del SII, resoluciones de Aduanas y directrices SERNAC.
            </p>
          </div>
          <button
            onClick={onNavigateToMarketInsights}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs sm:text-sm font-bold shadow-sm transition-all shrink-0"
          >
            <span>Ver Radar Regulatorio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Takeaway Summary Box */}
      <div className="bg-stone-900 text-stone-200 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white mb-1">
              Conclusión Clave de Rentabilidad
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              Con el 19% de IVA de la Ley 21.713 y las comisiones de pasarela local, el margen neto realista en dropshipping en Chile ronda el <strong>20% - 25%</strong> (benchmark saludable de la industria). Esto exige fijar un <strong>ROAS Breakeven mínimo de ≈ 2,2x</strong> (fórmula: 1 / margen bruto) antes de escalar pauta publicitaria.
            </p>
          </div>
          <div className="shrink-0 bg-stone-800 px-4 py-3 rounded-xl border border-stone-700 text-center">
            <div className="text-xs text-stone-400 font-medium">ROAS Breakeven Objetivo</div>
            <div className="text-2xl font-bold font-mono text-amber-400">≈ 2,2x</div>
            <div className="text-[11px] text-stone-400">Margen neto objetivo: 20-25%</div>
          </div>
        </div>
      </div>
    </div>
  );
};
