import React, { useState } from 'react';
import { X, Copy, Check, Printer, Download, FileText, FileDown } from 'lucide-react';
import { NICHES_DATA } from '../data/blueprintData';
import { formatCLP } from '../utils/calculator';
import { generateBusinessPlanPDF } from '../utils/pdfExport';

interface ExportSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  exchangeRate: number;
  completedTasksCount: number;
  totalTasksCount: number;
  completedTasks?: { [taskId: string]: boolean };
}

export const ExportSummaryModal: React.FC<ExportSummaryModalProps> = ({
  isOpen,
  onClose,
  exchangeRate,
  completedTasksCount,
  totalTasksCount,
  completedTasks = {}
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    try {
      setDownloadingPdf(true);
      generateBusinessPlanPDF({
        exchangeRate,
        completedTasks,
        exportScope: 'complete'
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setTimeout(() => setDownloadingPdf(false), 1200);
    }
  };

  const planText = `================================================================================
BLUEPRINT OPERATIVO — DROPSHIPPING / E-COMMERCE TRANSFRONTERIZO (CHILE-LATAM)
Actualizado a: Septiembre 2026
Tipo de cambio de referencia: USD 1 ≈ CLP ${exchangeRate} (Dólar Observado Banco Central)
================================================================================

1. AUDITORÍA DEL PLAN ORIGINAL (5 CAMBIOS CRÍTICOS):
--------------------------------------------------------------------------------
1. Shopify + Stripe: Shopify Payments no opera en Chile. Se requiere Webpay Plus (Transbank) como pasarela principal (1,75% débito / 2,35% crédito) + Mercado Pago (~3,09%+IVA) de respaldo.
2. TikTok Shop: Aún sin checkout nativo local en Chile (estimado Q3-Q4 2026). Se usa hoy para tráfico pagado hacia la tienda web.
3. Algoritmo Meta: Segmentación manual por intereses descontinuada; migración total a Advantage+ Shopping Campaigns (ASC). La segmentación por intereses se mantiene en TikTok Ads.
4. Ley N°21.713: Se eliminó la exención de IVA para compras bajo USD 41. TODAS las compras internacionales pagan 19% IVA sin importar el monto. Costo landed sube 19%.
5. Testing Ads: Presupuestos de USD 5-10/día deben concentrarse 100% en TikTok Ads (Grupo Broad); Meta Ads se activa recién con > USD 20/día.

2. NICHOS VALIDADOS Y ESTRUCTURA DE COSTOS 2026:
--------------------------------------------------------------------------------
- Mascotas: Costo USD $11 | Envío USD $5 | CIF $16 | IVA 19%: $3,0 | Landed USD $19,0 (~CLP $17.900) | PVP Sugerido: CLP $32.990 | Margen Bruto: ~46%
- Belleza/Skincare: Costo USD $8 | Envío USD $4 | CIF $12 | IVA 19%: $2,3 | Landed USD $14,3 (~CLP $13.400) | PVP Sugerido: CLP $24.990 | Margen Bruto: ~46%
- Hogar/Tech: Costo USD $18 | Envío USD $6 | CIF $24 | IVA 19%: $4,6 | Landed USD $28,6 (~CLP $26.900) | PVP Sugerido: CLP $49.990 | Margen Bruto: ~46%

*Benchmark de la industria: Margen neto realista de 20-25% descontando pasarela y ads.
*ROAS Breakeven mínimo: ≈ 1 / margen bruto ≈ 2,2x.

3. STACK TECNOLÓGICO Y PROVEEDORES:
--------------------------------------------------------------------------------
- Plataforma: Shopify Basic para Fases 1-2 (velocidad de salida); evaluar WooCommerce al escalar.
- Proveedores: Mes 1-2 DSers + AliExpress (15-25 días); al validar SKU migrar a CJdropshipping o Dropi LATAM (24-72h contra entrega).
- Facturación SII: Obligatorio conectar emisor DTE (Bsale, OpenFactura, Haulmer) para boleta DTE 39 automática.

4. LOGÍSTICA, COURIERS & FULFILLMENT CHILE 2026:
--------------------------------------------------------------------------------
- Peso Volumétrico Estándar: (Largo x Ancho x Alto cm) / 4.000.
- Couriers: Blue Express (Lockers PUDO 24/7 y e-commerce masivo), Starken (paquetes pesados y regiones), Chilexpress (Priority día siguiente), Chazki (Same-Day RM).
- Unit Economics Fulfillment: In-House hasta 350 envíos/mes ($0 bodega); sobre 350-500 pedidos/mes migrar a 3PL para ahorrar arriendo fijo y contratos de personal.
- Estrategia de Despacho: Envío Gratis sobre $29.990 CLP subsidiando $2.990 en packs y bundles.

5. ASPECTOS LEGALES Y TRIBUTARIOS (CHILE):
--------------------------------------------------------------------------------
- Inicio de Actividades SII: Giro "Venta al por menor por internet" (Código 479100).
- Régimen Tributario: Pro Pyme General (Art. 14 D N°3) o Transparente (14 D N°8).
- Aduana: Umbral US$ 500 (Courier simplificado vs. Agente de Aduanas formal sobre US$ 500).
- Cumplimiento SERNAC: Garantía legal obligatoria de 6 meses (derecho 3x3).

6. TRÁFICO PAGADO Y CREATIVOS:
--------------------------------------------------------------------------------
- TikTok Ads: 1 campaña CompletePayment, Grupo 1 Broad. 3-5 videos UGC verticales.
- Meta Ads (> USD 20/día): 1 campaña Advantage+ Shopping, 5-8 creativos, CAPI activado.
- Guión Ángulo 1 (15-20s): Hook dolor (0-3s) -> Demo en uso (3-12s) -> CTA + Webpay (12-18s).
- Guión Ángulo 2 (20-25s): Hook unboxing (0-3s) -> Reacción real (3-15s) -> CTA oferta (15-22s).

7. PROGRESO SPRINT 7 DÍAS:
--------------------------------------------------------------------------------
Tareas completadas: ${completedTasksCount} de ${totalTasksCount} (${Math.round((completedTasksCount / totalTasksCount) * 100)}%)
================================================================================`;

  const handleCopy = () => {
    navigator.clipboard.writeText(planText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">Resumen Ejecutivo del Blueprint Operativo</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-stone-800 bg-stone-50 space-y-3">
          <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed bg-white p-4 rounded-xl border border-stone-200 select-all">
            {planText}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-stone-500">
            Dólar observado: <strong className="text-stone-900">${exchangeRate} CLP</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Texto</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              <FileDown className="w-4 h-4 text-amber-400" />
              <span>{downloadingPdf ? 'Generando PDF...' : 'Descargar PDF Oficial'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
