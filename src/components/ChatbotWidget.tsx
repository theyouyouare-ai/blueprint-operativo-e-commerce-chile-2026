import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  UserCheck, 
  HelpCircle, 
  Truck, 
  CreditCard, 
  RotateCcw, 
  Package, 
  PhoneCall, 
  Sparkles, 
  ExternalLink, 
  Clock, 
  ShieldCheck, 
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ChatMessage, EscalationTicket } from '../types/chat';
import { STORE_FAQS, findMatchingFAQ, shouldTriggerEscalation, MOCK_TRACKING_DATABASE } from '../data/chatbotKnowledge';

interface ChatbotWidgetProps {
  onEscalateTicket?: (ticket: EscalationTicket) => void;
  externalOpen?: boolean;
  onToggleExternal?: (isOpen: boolean) => void;
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ 
  onEscalateTicket,
  externalOpen,
  onToggleExternal 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Escalation form state
  const [escalationForm, setEscalationForm] = useState({
    name: '',
    contact: '',
    orderId: '',
    category: 'envio' as EscalationTicket['category'],
    issue: ''
  });

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: '¡Hola! 👋 Soy el asistente virtual de la tienda. ¿En qué te puedo orientar hoy?',
      timestamp: 'Ahora',
      quickReplies: [
        '📊 Viabilidad y Break-even ROAS',
        '💰 Optimización de Capital de Trabajo',
        '📦 Couriers: Starken vs Blue',
        '📐 Peso Volumétrico (L*W*H/4000)',
        '🏭 3PL vs Bodega Propia',
        '⚖️ Código SII E-commerce',
        '🛃 Aduanas > USD 500 (DIN)',
        '🧾 Recuperar IVA en F29',
        '🔄 Garantía SERNAC 6 meses',
        '👤 Hablar con un humano'
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync external open state if provided
  useEffect(() => {
    if (externalOpen !== undefined) {
      setIsOpen(externalOpen);
    }
  }, [externalOpen]);

  const handleSetOpen = (open: boolean) => {
    setIsOpen(open);
    if (onToggleExternal) onToggleExternal(open);
    if (open) setHasUnread(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  // Send message handler
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    // Trigger escalation prompt if user explicitly wants human support
    const isEscalationIntent = shouldTriggerEscalation(query);

    try {
      // Call backend /api/chat
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversationHistory: messages.slice(-4).map((m) => ({
            sender: m.sender,
            text: m.text
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestEscalation: Boolean(data.isEscalation || isEscalationIntent),
          trackingData: data.trackingData,
          quickReplies: data.isEscalation || isEscalationIntent 
            ? ['👤 Generar Ticket con Ejecutivo', '🚚 Consultar plazos de envío', '💳 Ver medios de pago']
            : ['📦 Rastrear otro pedido', '🔄 Política de devoluciones', '👤 Hablar con un humano']
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error('Fallback to local knowledge');
      }
    } catch (err) {
      // Offline / client-side instant fallback
      const faqMatch = findMatchingFAQ(query);
      let fallbackText = '';
      let trackingInfo = undefined;

      const orderMatch = query.match(/#?CL-?\d{4}/i);
      if (orderMatch) {
        const cleanId = orderMatch[0].replace('#', '').replace('-', '').toUpperCase();
        const mappedKey = cleanId.startsWith('CL') ? `CL-${cleanId.slice(2)}` : `CL-${cleanId}`;
        trackingInfo = MOCK_TRACKING_DATABASE[mappedKey] || {
          orderId: `#${cleanId}`,
          status: 'En tránsito hacia el centro de distribución en Santiago',
          carrier: 'Chilexpress / Correos de Chile',
          eta: '7 a 10 días hábiles',
          location: 'Hub Internacional Pudahuel'
        };
        fallbackText = `He ubicado el estado de tu pedido **${trackingInfo.orderId}**:\n\n• **Estado actual:** ${trackingInfo.status}\n• **Operador logístico:** ${trackingInfo.carrier}\n• **Fecha estimada de entrega:** ${trackingInfo.eta}\n• **Ubicación:** ${trackingInfo.location}`;
      } else if (faqMatch) {
        fallbackText = faqMatch.detailedAnswer;
      } else if (isEscalationIntent) {
        fallbackText = 'Comprendo que necesitas asistencia directa para este caso. Te puedo transferir de inmediato con nuestro equipo de **Soporte Humano Especializado** en Chile.';
      } else {
        fallbackText = 'Gracias por tu mensaje. Nuestro equipo opera con despacho a todo Chile (15-25 días internacionales / 24-72h locales), pagos seguros vía Webpay Plus y Mercado Pago, y garantía legal de 6 meses bajo normativa SERNAC. ¿Deseas consultar sobre un producto en particular o transferirte con un ejecutivo?';
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestEscalation: isEscalationIntent,
        trackingData: trackingInfo,
        quickReplies: isEscalationIntent
          ? ['👤 Generar Ticket con Ejecutivo', '🚚 Plazos de envío']
          : ['🚚 Tiempos de envío', '💳 Medios de pago', '🔄 Garantía SERNAC', '👤 Hablar con un humano']
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
      if (!isOpen) setHasUnread(true);
    }
  };

  // Human Escalation Submission
  const handleSubmitEscalation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalationForm.name || !escalationForm.contact) return;

    const ticketId = `TK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTicket: EscalationTicket = {
      id: ticketId,
      customerName: escalationForm.name,
      contact: escalationForm.contact,
      orderId: escalationForm.orderId || undefined,
      category: escalationForm.category,
      issueDescription: escalationForm.issue || 'Solicitud de asistencia especializada en tienda online.',
      status: 'en_atencion',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      agentName: 'Matías González (Soporte Nivel 2)'
    };

    if (onEscalateTicket) {
      onEscalateTicket(newTicket);
    }

    // Post notification message to chat
    const escalationMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      sender: 'system',
      text: `✅ **Ticket de Atención Generado:** #${ticketId}\n👤 **Cliente:** ${escalationForm.name}\n📞 **Contacto:** ${escalationForm.contact}\n⏱ **Tiempo estimado de respuesta:** Menos de 10 minutos (Horario comercial 09:00 a 19:00 hrs Chile)\n👨‍💼 **Agente Asignado:** Matías González (Soporte Nivel 2)`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isEscalated: true,
      ticketId: ticketId
    };

    setMessages((prev) => [...prev, escalationMsg]);
    setShowEscalationModal(false);
    setEscalationForm({
      name: '',
      contact: '',
      orderId: '',
      category: 'envio',
      issue: ''
    });

    // Simulate agent joining the conversation after 2 seconds
    setTimeout(() => {
      const agentJoinMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: `Hola ${escalationForm.name || 'estimado/a'}, soy Matías del equipo de soporte humano. He tomado tu caso #${ticketId}. ¿En qué detalle puntual puedo asistirte de inmediato?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, agentJoinMsg]);
    }, 1800);
  };

  const handleQuickReply = (text: string) => {
    if (text.includes('Hablar con') || text.includes('Generar Ticket') || text.includes('humano')) {
      setShowEscalationModal(true);
    } else {
      handleSendMessage(text);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: '¡Conversación reiniciada! 👋 ¿En qué te puedo asesorar hoy sobre productos, envíos o medios de pago?',
        timestamp: 'Ahora',
        quickReplies: [
          '🚚 Tiempos de despacho',
          '💳 Medios de pago',
          '🔄 Garantía SERNAC',
          '📦 Rastrear mi pedido (#CL-8812)',
          '👤 Hablar con un humano'
        ]
      }
    ]);
  };

  return (
    <>
      {/* Floating Trigger Button in Bottom-Right */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
        {!isOpen && (
          <div className="mb-2.5 px-3 py-1.5 bg-stone-900 text-white text-xs font-semibold rounded-full shadow-lg border border-stone-700 flex items-center gap-1.5 animate-bounce">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Soporte Online 24/7 • Chile</span>
          </div>
        )}

        <button
          id="btn-open-chatbot-widget"
          onClick={() => handleSetOpen(!isOpen)}
          aria-label="Abrir asistente de soporte"
          className="relative w-14 h-14 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 border border-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageSquare className="w-6 h-6 text-amber-400" />
          )}

          {hasUnread && !isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white">
              1
            </span>
          )}
        </button>
      </div>

      {/* Chat Window Panel */}
      {isOpen && (
        <div 
          id="chatbot-widget-container"
          className="fixed bottom-22 right-4 sm:right-6 z-50 w-[92vw] sm:w-[410px] h-[580px] max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-sm">
                  AI
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-stone-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-white leading-none">
                    Asistente de Atención al Cliente
                  </h3>
                </div>
                <p className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
                  <span>Envíos, Garantías & Pagos Chile</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">Activo</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reiniciar conversación"
                className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleSetOpen(false)}
                title="Minimizar chat"
                className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notice Banner */}
          <div className="px-3.5 py-1.5 bg-stone-100 border-b border-stone-200 flex items-center justify-between text-[11px] text-stone-600">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Garantía SERNAC 6 meses • Webpay Plus</span>
            </div>
            <button
              onClick={() => setShowEscalationModal(true)}
              className="text-[11px] font-semibold text-stone-900 hover:underline flex items-center gap-1"
            >
              <UserCheck className="w-3 h-3 text-stone-700" />
              <span>Hablar con Ejecutivo</span>
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                {/* Sender Tag */}
                {msg.sender !== 'user' && (
                  <span className="text-[10px] font-medium text-stone-400 ml-1 mb-1 flex items-center gap-1">
                    {msg.sender === 'agent' ? (
                      <span className="text-amber-600 font-bold flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Agente Humano (Matías González)
                      </span>
                    ) : msg.sender === 'system' ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Sistema de Escalamiento
                      </span>
                    ) : (
                      'Bot de Soporte'
                    )}
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </span>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-stone-900 text-white rounded-br-none'
                      : msg.sender === 'agent'
                      ? 'bg-amber-50 text-stone-900 border border-amber-200 rounded-bl-none'
                      : msg.sender === 'system'
                      ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                      : 'bg-white text-stone-800 border border-stone-200 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Order Tracking Card if present */}
                  {msg.trackingData && (
                    <div className="mt-3 p-2.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1 text-[11px] text-stone-700">
                      <div className="flex items-center justify-between font-bold text-stone-900 border-b border-stone-200/70 pb-1">
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-stone-600" />
                          <span>Orden {msg.trackingData.orderId}</span>
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px]">
                          En Ruta
                        </span>
                      </div>
                      <div className="pt-1">
                        <strong>Operador:</strong> {msg.trackingData.carrier}
                      </div>
                      <div>
                        <strong>Entrega Estimada:</strong> {msg.trackingData.eta}
                      </div>
                      <div>
                        <strong>Última Ubicación:</strong> {msg.trackingData.location}
                      </div>
                    </div>
                  )}

                  {/* Escalation CTA if suggested */}
                  {msg.suggestEscalation && !msg.isEscalated && (
                    <div className="mt-2.5 pt-2 border-t border-stone-100">
                      <button
                        onClick={() => setShowEscalationModal(true)}
                        className="w-full py-1.5 px-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Transferir a Ejecutivo de Soporte Humano</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick replies */}
                {msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                    {msg.quickReplies.map((reply, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickReply(reply)}
                        className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 text-[11px] font-medium rounded-full border border-stone-200 transition-colors shadow-2xs"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-stone-400 p-2">
                <div className="w-2 h-2 rounded-full bg-stone-400 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-stone-400 animate-pulse delay-100" />
                <div className="w-2 h-2 rounded-full bg-stone-400 animate-pulse delay-200" />
                <span className="text-[11px] ml-1">Buscando respuesta oficial...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Category Bar */}
          <div className="px-3 py-1.5 bg-white border-t border-stone-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleSendMessage('¿Cuánto demoran los envíos a Chile?')}
              className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center gap-1"
            >
              <Truck className="w-3 h-3 text-stone-500" /> Envíos
            </button>
            <button
              onClick={() => handleSendMessage('¿Qué medios de pago aceptan?')}
              className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center gap-1"
            >
              <CreditCard className="w-3 h-3 text-stone-500" /> Pagos
            </button>
            <button
              onClick={() => handleSendMessage('¿Cómo funciona la garantía de 6 meses?')}
              className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3 text-stone-500" /> Devoluciones
            </button>
            <button
              onClick={() => handleSendMessage('¿Cuáles son los productos y especificaciones?')}
              className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center gap-1"
            >
              <Package className="w-3 h-3 text-stone-500" /> Catálogo
            </button>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-stone-200 flex items-center gap-2"
          >
            <input
              id="input-chatbot-message"
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Escribe tu consulta o número de pedido..."
              className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
            <button
              id="btn-send-chatbot-message"
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Human Escalation Modal */}
      {showEscalationModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-stone-900 text-white rounded-xl">
                  <UserCheck className="w-5 h-5 text-amber-400" />
                </span>
                <div>
                  <h4 className="text-base font-bold text-stone-900">
                    Escalamiento a Soporte Humano
                  </h4>
                  <p className="text-xs text-stone-500">
                    Atención personalizada con ejecutivo en Chile
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEscalationModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEscalation} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carolina Rojas"
                  value={escalationForm.name}
                  onChange={(e) => setEscalationForm({ ...escalationForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    WhatsApp o Correo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+56 9 1234 5678 o email"
                    value={escalationForm.contact}
                    onChange={(e) => setEscalationForm({ ...escalationForm, contact: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    N° de Pedido (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: #CL-8812"
                    value={escalationForm.orderId}
                    onChange={(e) => setEscalationForm({ ...escalationForm, orderId: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Categoría del Caso
                </label>
                <select
                  value={escalationForm.category}
                  onChange={(e) => setEscalationForm({ ...escalationForm, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-1 focus:ring-stone-900 bg-white"
                >
                  <option value="envio">Despacho o seguimiento de paquete</option>
                  <option value="devolucion">Garantía / Devolución SERNAC</option>
                  <option value="pago">Problema de Pago / Boleta o Factura DTE</option>
                  <option value="producto">Falla técnica o duda de producto</option>
                  <option value="otro">Otro caso especial</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Detalle de la Consulta o Reclamo
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe brevemente qué necesitas para que el ejecutivo tenga tu contexto listo..."
                  value={escalationForm.issue}
                  onChange={(e) => setEscalationForm({ ...escalationForm, issue: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-1 focus:ring-stone-900 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-stone-100">
                <a
                  href={`https://wa.me/56987654321?text=${encodeURIComponent(`Hola, necesito soporte para mi pedido en la tienda online. Nombre: ${escalationForm.name || 'Cliente'}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>WhatsApp Directo</span>
                </a>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Crear Ticket Prioritario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
