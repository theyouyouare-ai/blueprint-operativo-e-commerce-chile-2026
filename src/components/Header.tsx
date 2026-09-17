import React from 'react';
import { Calendar, DollarSign, RefreshCw, FileText, CheckCircle2, MessageSquare, Headphones, Globe } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  exchangeRate: number;
  onOpenExport: () => void;
  onOpenChatbot?: () => void;
  completedTasksCount: number;
  totalTasksCount: number;
  activeTicketsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  exchangeRate,
  onOpenExport,
  onOpenChatbot,
  completedTasksCount,
  totalTasksCount,
  activeTicketsCount = 0
}) => {
  const tabs = [
    { id: 'auditoria', label: '1. Auditoría 2026' },
    { id: 'calculadora', label: '2. Simulador Financiero' },
    { id: 'nichos', label: '3. Nichos & Validación' },
    { id: 'compliance', label: '4. Compliance & Operativa SII' },
    { id: 'logistica', label: '5. Logística, Fulfillment & APIs' },
    { id: 'dashboard_ejecutivo', label: '6. Dashboard Consolidado & Exportación' },
    { id: 'stack', label: '7. Stack & Pasarelas' },
    { id: 'landing_legal', label: '8. Landing & Conversión' },
    { id: 'ads', label: '9. TikTok / Meta Ads' },
    { id: 'qa_suite', label: '10. QA, Resiliencia & CI/CD' },
    { id: 'sprint', label: '11. Sprint 7 Días' },
    { id: 'atencion_cliente', label: '12. Chatbot & Soporte' },
    { id: 'market_insights', label: '13. Radar Regulatorio & Noticias' },
  ];

  const progressPct = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-white font-bold text-lg tracking-wider shadow-sm">
              CL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight leading-tight">
                  Blueprint Operativo E-commerce
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Septiembre 2026
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden sm:block">
                Dropshipping Transfronterizo Chile-LATAM • Ley N°21.713 • Dólar Ref: USD 1 ≈ CLP {exchangeRate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Market Insights Live Action Button */}
            <button
              id="btn-header-market-insights"
              onClick={() => setActiveTab('market_insights')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors"
              title="Noticias Regulatorias y Logísticas en Vivo (Google Search)"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Radar Legal</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>

            {/* Chatbot Action Button */}
            <button
              id="btn-header-chatbot"
              onClick={onOpenChatbot || (() => setActiveTab('atencion_cliente'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold shadow-xs transition-colors"
              title="Abrir Chatbot de Soporte"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chatbot 24/7</span>
              {activeTicketsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center">
                  {activeTicketsCount}
                </span>
              )}
            </button>

            {/* Sprint Progress Pill */}
            <button
              onClick={() => setActiveTab('sprint')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors"
              title="Progreso del Sprint de 7 Días"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Sprint:</span>
              <span className="font-bold text-stone-900">{progressPct}%</span>
            </button>

            {/* Export Summary Action */}
            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar Plan</span>
              <span className="sm:hidden">Plan</span>
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Subbar */}
        <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-stone-100 no-scrollbar text-xs sm:text-sm font-medium">
          <a href="/checkout" className="shrink-0 rounded-lg bg-amber-100 px-3 py-2 font-semibold text-amber-900">Tienda / Checkout</a>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`btn-tab-${tab.id}`}
                data-testid={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-md transition-all ${
                  isActive
                    ? 'bg-stone-900 text-white font-semibold shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
