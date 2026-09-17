import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ExchangeRateBar } from './components/ExchangeRateBar';
import { AuditSection } from './components/AuditSection';
import { UnitEconomicsCalculator } from './components/UnitEconomicsCalculator';
import { NichesAndValidation } from './components/NichesAndValidation';
import { ComplianceTab } from './components/tabs/ComplianceTab';
import { LogisticsTab } from './components/tabs/LogisticsTab';
import { ExecutiveDashboardTab } from './components/tabs/ExecutiveDashboardTab';
import { TechStackAndGateways } from './components/TechStackAndGateways';
import { LandingAndLegal } from './components/LandingAndLegal';
import { TrafficAndAdsStrategy } from './components/TrafficAndAdsStrategy';
import { QATestSuiteTab } from './components/tabs/QATestSuiteTab';
import { Sprint7Days } from './components/Sprint7Days';
import { CustomerServiceCenter } from './components/CustomerServiceCenter';
import { ChatbotWidget } from './components/ChatbotWidget';
import { MarketInsightsWidget } from './components/MarketInsightsWidget';
import { ExportSummaryModal } from './components/ExportSummaryModal';
import { SPRINT_7_DAYS } from './data/blueprintData';
import { EscalationTicket } from './types/chat';
import { 
  AlertTriangle, 
  Calculator, 
  Sparkles, 
  Layers, 
  Scale, 
  Megaphone, 
  Calendar,
  ShieldCheck,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('auditoria');
  const [exchangeRate, setExchangeRate] = useState<number>(940);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);

  // Human Escalated Tickets State
  const [escalatedTickets, setEscalatedTickets] = useState<EscalationTicket[]>(() => {
    try {
      const saved = localStorage.getItem('dropship_escalated_tickets_2026');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'TK-2026-1042',
        customerName: 'Claudia Miranda',
        contact: '+56 9 7654 3210',
        orderId: '#CL-8812',
        category: 'pago',
        issueDescription: 'Solicita emisión de Factura Electrónica (DTE 33) ingresando RUT de su sociedad para deducir IVA crédito fiscal.',
        status: 'en_atencion',
        createdAt: '11:20 AM',
        agentName: 'Matías González (Soporte Nivel 2)'
      },
      {
        id: 'TK-2026-0921',
        customerName: 'Juan Pablo Lagos',
        contact: '+56 9 8844 1122',
        orderId: '#CL-2026',
        category: 'devolucion',
        issueDescription: 'Garantía SERNAC aplicada por cable USB con defecto de contacto. Se emitió etiqueta prepagada Chilexpress para reemplazo express sin costo.',
        status: 'resuelto',
        createdAt: 'Ayer 16:45 PM',
        agentName: 'Camila Morales'
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('dropship_escalated_tickets_2026', JSON.stringify(escalatedTickets));
    } catch (e) {
      console.error(e);
    }
  }, [escalatedTickets]);

  const handleEscalateTicket = (newTicket: EscalationTicket) => {
    setEscalatedTickets((prev) => [newTicket, ...prev]);
  };

  const handleUpdateTicketStatus = (ticketId: string, status: EscalationTicket['status']) => {
    setEscalatedTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status } : t))
    );
  };

  const activeTicketsCount = escalatedTickets.filter(
    (t) => t.status === 'en_atencion' || t.status === 'abierto'
  ).length;

  // Sprint tasks state persisted in localStorage
  const [completedTasks, setCompletedTasks] = useState<{ [taskId: string]: boolean }>(() => {
    try {
      const saved = localStorage.getItem('dropship_sprint_tasks_2026');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default initial checked items for realistic onboarding
    return {
      d1_t1: true,
      d1_t2: true,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('dropship_sprint_tasks_2026', JSON.stringify(completedTasks));
    } catch (e) {
      console.error(e);
    }
  }, [completedTasks]);

  const handleToggleTask = (taskId: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleResetAllTasks = () => {
    setCompletedTasks({});
  };

  const handleCheckAllTasks = () => {
    const allDone: { [taskId: string]: boolean } = {};
    SPRINT_7_DAYS.forEach((d) => d.tasks.forEach((t) => (allDone[t.id] = true)));
    setCompletedTasks(allDone);
  };

  const allTaskIds = SPRINT_7_DAYS.flatMap((d) => d.tasks.map((t) => t.id));
  const totalTasksCount = allTaskIds.length;
  const completedTasksCount = allTaskIds.filter((id) => completedTasks[id]).length;

  const tabsOrder = [
    'auditoria',
    'calculadora',
    'nichos',
    'compliance',
    'logistica',
    'dashboard_ejecutivo',
    'stack',
    'landing_legal',
    'ads',
    'qa_suite',
    'sprint',
    'atencion_cliente',
    'market_insights'
  ];

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 text-stone-900 selection:bg-amber-200 selection:text-stone-900">
      {/* Top Fixed Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        exchangeRate={exchangeRate}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenChatbot={() => setIsChatbotOpen(true)}
        completedTasksCount={completedTasksCount}
        totalTasksCount={totalTasksCount}
        activeTicketsCount={activeTicketsCount}
      />

      {/* Dynamic Exchange Rate Ticker */}
      <ExchangeRateBar
        exchangeRate={exchangeRate}
        setExchangeRate={setExchangeRate}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Dynamic Section Switcher */}
        {activeTab === 'auditoria' && (
          <AuditSection onNavigateToMarketInsights={() => setActiveTab('market_insights')} />
        )}
        {activeTab === 'calculadora' && (
          <UnitEconomicsCalculator
            exchangeRate={exchangeRate}
            completedTasks={completedTasks}
          />
        )}
        {activeTab === 'nichos' && <NichesAndValidation exchangeRate={exchangeRate} />}
        {activeTab === 'compliance' && <ComplianceTab exchangeRate={exchangeRate} />}
        {activeTab === 'logistica' && <LogisticsTab exchangeRate={exchangeRate} />}
        {activeTab === 'dashboard_ejecutivo' && <ExecutiveDashboardTab />}
        {activeTab === 'stack' && <TechStackAndGateways />}
        {activeTab === 'landing_legal' && <LandingAndLegal />}
        {activeTab === 'ads' && <TrafficAndAdsStrategy />}
        {activeTab === 'qa_suite' && <QATestSuiteTab onNavigateToTab={(tab) => setActiveTab(tab)} />}
        {activeTab === 'sprint' && (
          <Sprint7Days
            completedTasks={completedTasks}
            onToggleTask={handleToggleTask}
            onResetAllTasks={handleResetAllTasks}
            onCheckAllTasks={handleCheckAllTasks}
            exchangeRate={exchangeRate}
          />
        )}
        {activeTab === 'atencion_cliente' && (
          <CustomerServiceCenter
            onOpenChatbotWidget={() => setIsChatbotOpen(true)}
            escalatedTickets={escalatedTickets}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onAddTicket={handleEscalateTicket}
          />
        )}
        {activeTab === 'market_insights' && <MarketInsightsWidget />}

        {/* Bottom Navigation Pagination Bar */}
        <div className="mt-8 pt-6 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Versión 2026.9 • Dólar Observado: <strong>CLP ${exchangeRate}</strong> • Ley N°21.713</span>
          </div>

          <div className="flex items-center gap-2">
            {activeTab !== 'auditoria' && (
              <button
                onClick={() => {
                  const currentIndex = tabsOrder.indexOf(activeTab);
                  if (currentIndex > 0) setActiveTab(tabsOrder[currentIndex - 1]);
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 hover:bg-stone-50 font-medium text-stone-700 transition-colors"
              >
                ← Sección Anterior
              </button>
            )}

            {activeTab !== 'atencion_cliente' && (
              <button
                onClick={() => {
                  const currentIndex = tabsOrder.indexOf(activeTab);
                  if (currentIndex < tabsOrder.length - 1) setActiveTab(tabsOrder[currentIndex + 1]);
                }}
                className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium transition-colors flex items-center gap-1 shadow-sm"
              >
                <span>Siguiente Sección</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Floating Chatbot Widget (Always Available) */}
      <ChatbotWidget
        externalOpen={isChatbotOpen}
        onToggleExternal={setIsChatbotOpen}
        onEscalateTicket={handleEscalateTicket}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-6 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-stone-400" />
            <span>
              Blueprint Operativo Dropshipping Chile-LATAM © 2026. Basado en normativas del SII, Transbank y SERNAC.
            </span>
          </div>
          <div className="flex items-center gap-4 text-stone-400">
            <span>Ley 21.713 (IVA 19%)</span>
            <span>•</span>
            <span>Pro Pyme General 14 D N°3</span>
            <span>•</span>
            <span>Webpay Plus Transbank</span>
          </div>
        </div>
      </footer>

      {/* Export Summary Modal */}
      <ExportSummaryModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        exchangeRate={exchangeRate}
        completedTasksCount={completedTasksCount}
        totalTasksCount={totalTasksCount}
        completedTasks={completedTasks}
      />
    </div>
  );
}

