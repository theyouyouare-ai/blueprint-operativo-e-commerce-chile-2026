export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'agent' | 'system';
  text: string;
  timestamp: string;
  quickReplies?: string[];
  suggestEscalation?: boolean;
  isEscalated?: boolean;
  ticketId?: string;
  trackingData?: {
    orderId: string;
    status: string;
    carrier: string;
    eta: string;
    location: string;
  };
}

export interface EscalationTicket {
  id: string;
  customerName: string;
  contact: string; // WhatsApp or email
  orderId?: string;
  category: 'envio' | 'devolucion' | 'pago' | 'producto' | 'otro';
  issueDescription: string;
  status: 'abierto' | 'en_atencion' | 'resuelto';
  createdAt: string;
  agentName?: string;
}

export interface FAQItem {
  id: string;
  category: 'productos' | 'envios' | 'devoluciones' | 'pagos' | 'compliance' | 'logistica' | 'auditoria';
  question: string;
  shortAnswer: string;
  detailedAnswer: string;
  tags: string[];
}
