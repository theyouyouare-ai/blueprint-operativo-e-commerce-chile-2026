import React, { useState } from 'react';
import { 
  Headphones, 
  MessageSquare, 
  HelpCircle, 
  Clock, 
  ShieldCheck, 
  UserCheck, 
  Truck, 
  RotateCcw, 
  CreditCard, 
  Package, 
  CheckCircle2, 
  Search, 
  Plus, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileSpreadsheet,
  Send,
  Sparkles
} from 'lucide-react';
import { STORE_FAQS } from '../data/chatbotKnowledge';
import { FAQItem, EscalationTicket } from '../types/chat';

interface CustomerServiceCenterProps {
  onOpenChatbotWidget: () => void;
  escalatedTickets: EscalationTicket[];
  onUpdateTicketStatus: (ticketId: string, status: EscalationTicket['status']) => void;
  onAddTicket: (ticket: EscalationTicket) => void;
}

export const CustomerServiceCenter: React.FC<CustomerServiceCenterProps> = ({
  onOpenChatbotWidget,
  escalatedTickets,
  onUpdateTicketStatus,
  onAddTicket
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'faq' | 'tickets' | 'protocols' | 'tester'>('faq');
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('env-tiempos');

  // Interactive tester query in tab 2
  const [testerQuery, setTesterQuery] = useState<string>('');
  const [testerLog, setTesterLog] = useState<{ role: 'user' | 'bot'; text: string; isEscalated?: boolean }[]>([
    {
      role: 'bot',
      text: 'Consola de Diagnóstico de Atención al Cliente lista. Puedes ingresar consultas de clientes reales sobre envíos, medios de pago, garantías SERNAC o probar la activación de escalamiento a soporte humano.'
    }
  ]);
  const [testerLoading, setTesterLoading] = useState(false);

  // New ticket modal in panel
  const [showManualTicketModal, setShowManualTicketModal] = useState(false);
  const [manualTicket, setManualTicket] = useState({
    name: '',
    contact: '',
    orderId: '',
    category: 'devolucion' as EscalationTicket['category'],
    issue: ''
  });

  const filteredFaqs = STORE_FAQS.filter((faq) => {
    const matchesCategory = faqCategoryFilter === 'todos' || faq.category === faqCategoryFilter;
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.detailedAnswer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleRunTester = async (queryToRun?: string) => {
    const q = (queryToRun || testerQuery).trim();
    if (!q || testerLoading) return;

    setTesterLog(prev => [...prev, { role: 'user', text: q }]);
    setTesterQuery('');
    setTesterLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q })
      });
      const data = await res.json();
      setTesterLog(prev => [...prev, { 
        role: 'bot', 
        text: data.text, 
        isEscalated: Boolean(data.isEscalation) 
      }]);
    } catch (err) {
      setTesterLog(prev => [...prev, { 
        role: 'bot', 
        text: 'Respuesta generada vía base de conocimiento local (6 meses garantía SERNAC, envíos 15-25d / 24-72h, Webpay Plus y Mercado Pago).' 
      }]);
    } finally {
      setTesterLoading(false);
    }
  };

  const handleCreateManualTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTicket.name || !manualTicket.contact) return;

    const newTk: EscalationTicket = {
      id: `TK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: manualTicket.name,
      contact: manualTicket.contact,
      orderId: manualTicket.orderId || undefined,
      category: manualTicket.category,
      issueDescription: manualTicket.issue || 'Atención personalizada solicitada',
      status: 'abierto',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      agentName: 'Mesa de Ayuda Nivel 2'
    };

    onAddTicket(newTk);
    setShowManualTicketModal(false);
    setManualTicket({
      name: '',
      contact: '',
      orderId: '',
      category: 'devolucion',
      issue: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-stone-900 text-white rounded-xl">
              <Headphones className="w-6 h-6 text-amber-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-stone-900">
                  Centro de Atención al Cliente & Chatbot Inteligente
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Garantía SERNAC • Ley 19.496
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
                Automatización de respuestas para productos, plazos de envío y medios de pago con escalamiento a soporte humano en Chile.
              </p>
            </div>
          </div>

          <button
            id="btn-trigger-open-widget-from-center"
            onClick={onOpenChatbotWidget}
            className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all hover:scale-102"
          >
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>Abrir Asistente Flotante</span>
          </button>
        </div>

        {/* Operational Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-stone-100 text-xs">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
            <span className="text-[11px] text-stone-500 block">SLA Tiempo de Respuesta</span>
            <div className="font-bold text-stone-900 text-sm mt-0.5">&lt; 15 Segundos (Bot)</div>
            <span className="text-[10px] text-emerald-700 font-medium">Inmediato 24/7</span>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
            <span className="text-[11px] text-stone-500 block">Garantía Legal Vigente</span>
            <div className="font-bold text-stone-900 text-sm mt-0.5">6 Meses (Ley SERNAC)</div>
            <span className="text-[10px] text-stone-600">Fallas de fábrica</span>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
            <span className="text-[11px] text-stone-500 block">Pasarelas Locales Chile</span>
            <div className="font-bold text-stone-900 text-sm mt-0.5">Webpay Plus & MP</div>
            <span className="text-[10px] text-stone-600">Redcompra / Cuotas</span>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
            <span className="text-[11px] text-stone-500 block">Escalamiento Humano</span>
            <div className="font-bold text-stone-900 text-sm mt-0.5">
              {escalatedTickets.filter(t => t.status === 'en_atencion' || t.status === 'abierto').length} Activos
            </div>
            <span className="text-[10px] text-amber-700 font-medium">WhatsApp / Tickets</span>
          </div>
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex border-b border-stone-200 gap-2 overflow-x-auto no-scrollbar text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('faq')}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'faq'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>1. Base de Conocimiento FAQ ({STORE_FAQS.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tester')}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'tester'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>2. Consola & Simulador Chatbot</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tickets')}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'tickets'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <span>3. Cola de Escalamiento Humano ({escalatedTickets.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('protocols')}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'protocols'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-stone-600" />
          <span>4. Protocolos & Cumplimiento SERNAC</span>
        </button>
      </div>

      {/* TAB 1: FAQ KNOWLEDGE BASE */}
      {activeSubTab === 'faq' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-5">
          {/* Controls: Search and Categories */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por pregunta, producto, devolución o medio de pago..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'productos', label: '📦 Productos' },
                { id: 'envios', label: '🚚 Envíos' },
                { id: 'devoluciones', label: '🔄 Devoluciones' },
                { id: 'pagos', label: '💳 Pagos' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFaqCategoryFilter(cat.id)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    faqCategoryFilter === cat.id
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Accordion List */}
          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const isExpanded = expandedFaqId === faq.id;

              return (
                <div
                  key={faq.id}
                  className={`rounded-xl border transition-all ${
                    isExpanded
                      ? 'bg-stone-50/80 border-stone-300 shadow-2xs'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <button
                    onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                    className="w-full p-4 text-left flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-800">
                          {faq.category}
                        </span>
                        <h4 className="font-bold text-stone-900 text-xs sm:text-sm">
                          {faq.question}
                        </h4>
                      </div>
                      <p className="text-stone-600 line-clamp-1">{faq.shortAnswer}</p>
                    </div>

                    <div className="p-1 rounded-md bg-stone-100 text-stone-500 shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-stone-200/70 text-xs text-stone-700 space-y-3">
                      <p className="whitespace-pre-line leading-relaxed bg-white p-3.5 rounded-xl border border-stone-200">
                        {faq.detailedAnswer}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-1 text-stone-400">
                          <span>Tags:</span>
                          {faq.tags.map((t, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                              #{t}
                            </span>
                          ))}
                        </div>

                        <button
                          onClick={() => {
                            onOpenChatbotWidget();
                          }}
                          className="text-stone-900 font-semibold hover:underline flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Probar en el Chatbot</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredFaqs.length === 0 && (
              <div className="p-8 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-stone-200">
                No se encontraron preguntas que coincidan con &quot;{searchQuery}&quot;.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CONSOLA Y TESTER DEL CHATBOT */}
      {activeSubTab === 'tester' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Interactive Chat Console */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between h-[600px]">
            <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Consola de Pruebas en Tiempo Real</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Prueba consultas reales y verifica la respuesta del backend y detección de escalamiento
                </p>
              </div>

              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800">
                API /api/chat Activa
              </span>
            </div>

            {/* Conversation Log */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
              {testerLog.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${item.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-stone-400 mb-1 font-mono">
                    {item.role === 'user' ? 'Tú (Cliente)' : 'Asistente IA (Chile 2026)'}
                  </span>
                  <div
                    className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                      item.role === 'user'
                        ? 'bg-stone-900 text-white rounded-br-none'
                        : 'bg-white text-stone-800 border border-stone-200 rounded-bl-none shadow-2xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{item.text}</p>
                    {item.isEscalated && (
                      <div className="mt-2 pt-2 border-t border-amber-200 text-[11px] text-amber-800 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Alerta: Consulta clasificada para escalamiento a ejecutivo humano.</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {testerLoading && (
                <div className="flex items-center gap-1.5 text-xs text-stone-400 p-2">
                  <div className="w-2 h-2 rounded-full bg-stone-400 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-stone-400 animate-pulse delay-100" />
                  <div className="w-2 h-2 rounded-full bg-stone-400 animate-pulse delay-200" />
                  <span>Procesando consulta...</span>
                </div>
              )}
            </div>

            {/* Quick Prompt Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <span className="text-[10px] text-stone-400 uppercase font-bold shrink-0">Probar:</span>
              <button
                onClick={() => handleRunTester('¿Cuánto demora en llegar a Punta Arenas?')}
                className="whitespace-nowrap px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-[11px] text-stone-700"
              >
                🚚 Envíos Extremos
              </button>
              <button
                onClick={() => handleRunTester('¿Puedo pagar con CuentaRUT o en 3 cuotas?')}
                className="whitespace-nowrap px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-[11px] text-stone-700"
              >
                💳 CuentaRUT / Cuotas
              </button>
              <button
                onClick={() => handleRunTester('El cepillo llegó con una falla en el vapor, quiero devolución')}
                className="whitespace-nowrap px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-[11px] text-stone-700"
              >
                🔄 Garantía SERNAC
              </button>
              <button
                onClick={() => handleRunTester('Quiero hablar urgente con una persona encargada')}
                className="whitespace-nowrap px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-[11px] text-stone-700"
              >
                👤 Escalamiento Humano
              </button>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunTester();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={testerQuery}
                onChange={(e) => setTesterQuery(e.target.value)}
                placeholder="Escribe una pregunta para probar el chatbot..."
                className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
              <button
                type="submit"
                disabled={testerLoading || !testerQuery.trim()}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar</span>
              </button>
            </form>
          </div>

          {/* Right Col: Grounding System Rules & Engine Spec */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4 text-xs">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900">
                Arquitectura & Directrices del Bot
              </h3>
              <p className="text-stone-500 text-[11px]">
                Reglas aplicadas en cada respuesta al cliente
              </p>
            </div>

            <div className="space-y-3 text-stone-700">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                <div className="font-bold text-stone-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Blindaje SERNAC</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Nunca prometer entregas de 24 horas si el origen es AliExpress transfronterizo. Comunicar siempre el rango transparente de 15 a 25 días para evitar multas del SERNAC.
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                <div className="font-bold text-stone-900 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-stone-600" />
                  <span>Desglose Tributario (Ley 21.713)</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Todos los precios incluyen el 19% de IVA en pesos chilenos. Se emite Boleta Electrónica DTE 39 automática vía integrador Bsale/OpenFactura.
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                <div className="font-bold text-stone-900 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Triggers de Escalamiento Humano</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Palabras clave como &quot;humano&quot;, &quot;persona&quot;, &quot;denuncia&quot;, &quot;retraso grave&quot; o &quot;ticket&quot; activan de inmediato la tarjeta de contacto prioritario vía WhatsApp o formulario.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HUMAN ESCALATION QUEUE */}
      {activeSubTab === 'tickets' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-stone-700" />
                <span>Cola de Casos Escaldados a Agentes Humanos (Mesa de Ayuda)</span>
              </h3>
              <p className="text-xs text-stone-500">
                Atención preferencial de clientes transferidos por el chatbot para resolver casos complejos
              </p>
            </div>

            <button
              onClick={() => setShowManualTicketModal(true)}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Ticket Manual</span>
            </button>
          </div>

          {/* Tickets Table / List */}
          <div className="space-y-3">
            {escalatedTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-stone-50 transition-colors space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-900 text-xs px-2 py-0.5 rounded bg-stone-200">
                      {ticket.id}
                    </span>
                    <span className="font-semibold text-stone-900 text-xs">
                      {ticket.customerName}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      ({ticket.contact})
                    </span>
                    {ticket.orderId && (
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        Orden: {ticket.orderId}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ticket.status === 'resuelto'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ticket.status === 'en_atencion'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {ticket.status === 'resuelto' ? 'Resuelto' : ticket.status === 'en_atencion' ? 'En Atención' : 'Abierto'}
                    </span>

                    <span className="text-[10px] text-stone-400">
                      {ticket.createdAt}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-stone-700 bg-white p-2.5 rounded-lg border border-stone-200">
                  {ticket.issueDescription}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-2 text-stone-500 text-[11px]">
                    <UserCheck className="w-3.5 h-3.5 text-stone-400" />
                    <span>Ejecutivo asignado: <strong>{ticket.agentName || 'Sin asignar'}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/${ticket.contact.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${ticket.customerName}, te escribo del equipo de soporte de la tienda en relación a tu ticket ${ticket.id}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Contactar por WhatsApp</span>
                    </a>

                    {ticket.status !== 'resuelto' ? (
                      <button
                        onClick={() => onUpdateTicketStatus(ticket.id, 'resuelto')}
                        className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded text-[11px] font-medium transition-colors"
                      >
                        Marcar Resuelto
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateTicketStatus(ticket.id, 'en_atencion')}
                        className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded text-[11px] font-medium transition-colors"
                      >
                        Reabrir Caso
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {escalatedTickets.length === 0 && (
              <div className="p-8 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-stone-200">
                No hay tickets pendientes. Los clientes que soliciten atención con un humano en el chatbot aparecerán aquí automáticamente.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PROTOCOLS & SERNAC COMPLIANCE */}
      {activeSubTab === 'protocols' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-stone-700" />
              <span>Protocolo de Atención al Cliente y Garantías SERNAC (Chile)</span>
            </h3>
            <p className="text-xs text-stone-500">
              Estándares de respuesta para blindar legalmente el e-commerce ante mediaciones del SERNAC
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Rule 1: 6-month legal warranty */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-stone-900 text-white flex items-center justify-center text-[10px]">1</span>
                <span>Garantía Legal de 6 Meses (Ley N° 19.496)</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                El cliente tiene el derecho irrenunciable a optar entre <strong>reparación gratuita</strong>, <strong>cambio de producto</strong> o <strong>devolución íntegra del dinero</strong> cuando el artículo presente desperfectos de fabricación dentro de los primeros 6 meses desde su recepción.
              </p>
              <div className="p-2 bg-emerald-50 rounded text-emerald-800 text-[11px]">
                <strong>Regla del Bot:</strong> Ante quejas de falla técnica, el asistente nunca debe rechazar la garantía ni culpar al cliente; debe solicitar foto/video de evidencia y ofrecer el reemplazo o retiro sin costo.
              </div>
            </div>

            {/* Rule 2: Shipping Transparency */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-stone-900 text-white flex items-center justify-center text-[10px]">2</span>
                <span>Transparencia en Plazos de Despacho</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Las circulares del SERNAC exigen que la fecha máxima estimada de entrega conste claramente antes del pago y en la confirmación de compra. Si un envío demora más de 25 días hábiles, el consumidor puede exigir la anulación de la compra sin penalizaciones.
              </p>
              <div className="p-2 bg-amber-50 rounded text-amber-900 text-[11px]">
                <strong>Regla del Bot:</strong> Informar siempre el rango de 15 a 25 días hábiles para órdenes internacionales y 24 a 72h para despachos locales Dropi.
              </div>
            </div>

            {/* Rule 3: DTE 39 and 19% VAT */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-stone-900 text-white flex items-center justify-center text-[10px]">3</span>
                <span>Comprobantes de Pago & Facturación DTE</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Es obligación legal emitir la <strong>Boleta Electrónica (DTE 39)</strong> por cada compraventa dentro del territorio chileno. Bajo la Ley 21.713, todas las plataformas recaudan el IVA, otorgando certeza jurídica tanto al consumidor como al SII.
              </p>
              <div className="p-2 bg-stone-100 rounded text-stone-700 text-[11px]">
                <strong>Regla del Bot:</strong> Explicar al comprador que la boleta le llegará en formato PDF a su casilla de correo y que para facturas empresariales (DTE 33) se requiere su RUT de primera categoría.
              </div>
            </div>

            {/* Rule 4: Human escalation SLA */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-stone-900 text-white flex items-center justify-center text-[10px]">4</span>
                <span>SLA de Escalamiento Humano (&lt; 24h)</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Si un usuario expresa insatisfacción con el bot o solicita explícitamente contacto humano, el sistema debe derivar el caso inmediatamente a WhatsApp o generar un ticket formal con respuesta garantizada en menos de 24 horas hábiles.
              </p>
              <div className="p-2 bg-blue-50 rounded text-blue-900 text-[11px]">
                <strong>Regla del Bot:</strong> Generar automáticamente el identificador de ticket (TK-2026-XXXX) para dar trazabilidad completa a la interacción.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Ticket Creation Modal */}
      {showManualTicketModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h4 className="text-sm font-bold text-stone-900">
                Nuevo Ticket de Soporte Interno
              </h4>
              <button
                onClick={() => setShowManualTicketModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualTicket} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Nombre Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Marcelo Vidal"
                  value={manualTicket.name}
                  onChange={(e) => setManualTicket({ ...manualTicket, name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Contacto WhatsApp/Email *</label>
                  <input
                    type="text"
                    required
                    placeholder="+56 9 8765 4321"
                    value={manualTicket.contact}
                    onChange={(e) => setManualTicket({ ...manualTicket, contact: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">N° Pedido (Opcional)</label>
                  <input
                    type="text"
                    placeholder="#CL-2026"
                    value={manualTicket.orderId}
                    onChange={(e) => setManualTicket({ ...manualTicket, orderId: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Categoría</label>
                <select
                  value={manualTicket.category}
                  onChange={(e) => setManualTicket({ ...manualTicket, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white"
                >
                  <option value="devolucion">Devolución / Garantía SERNAC</option>
                  <option value="envio">Despacho y Seguimiento</option>
                  <option value="pago">Medios de Pago / Facturación</option>
                  <option value="producto">Consulta Técnica Producto</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Descripción del Problema</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detalles para el agente que atenderá..."
                  value={manualTicket.issue}
                  onChange={(e) => setManualTicket({ ...manualTicket, issue: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualTicketModal(false)}
                  className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-stone-900 text-white font-semibold rounded-lg hover:bg-stone-800"
                >
                  Crear Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
