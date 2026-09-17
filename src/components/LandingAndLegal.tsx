import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  Scale, 
  FileCheck, 
  ShieldAlert, 
  Clock, 
  Eye, 
  ShoppingBag, 
  Building2, 
  CheckCircle2, 
  FileSpreadsheet
} from 'lucide-react';

export const LandingAndLegal: React.FC = () => {
  // Interactive landing checklist
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({
    aboveFold: true,
    socialProof: true,
    shippingPolicy: false,
    returnsVisible: false,
    sernacUrgency: false,
    checkoutSteps: true,
    webPerformance: false
  });

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalChecks = Object.keys(checkedItems).length;
  const completedChecks = Object.values(checkedItems).filter(Boolean).length;
  const auditPct = Math.round((completedChecks / totalChecks) * 100);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-stone-900 text-white rounded-xl">
            <Scale className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-stone-900">
              FASE 3 — Diseño e Implementación MVP & Marco Legal/Tributario Chile
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Estándar de conversión en landing page, auditoría SERNAC de transparencia y formalización ante el SII.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Landing Page Checklist */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-stone-700" />
              <span>Checklist de Landing de Producto (Ficha de Alta Conversión)</span>
            </h3>
            <p className="text-xs text-stone-500">
              Puntos críticos para convertir tráfico frío y evitar rechazos de pasarelas
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-stone-100 rounded-full text-xs font-semibold text-stone-800">
            <span>Auditoría Landing:</span>
            <span className="text-emerald-700 font-bold">{completedChecks}/{totalChecks} ({auditPct}%)</span>
          </div>
        </div>

        {/* Interactive Checkbox List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Item 1 */}
          <div
            onClick={() => toggleCheck('aboveFold')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
              checkedItems.aboveFold ? 'bg-emerald-50/50 border-emerald-200' : 'bg-stone-50 border-stone-200'
            }`}
          >
            {checkedItems.aboveFold ? (
              <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
            )}
            <div className="text-xs">
              <span className="font-bold text-stone-900 block">Sobre el Pliegue (Above the Fold)</span>
              <p className="text-stone-600 mt-0.5">
                Propuesta de valor clara en 1 frase + video o GIF del producto en uso real (no solo renders estáticos de catálogo).
              </p>
            </div>
          </div>

          {/* Item 2 */}
          <div
            onClick={() => toggleCheck('socialProof')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
              checkedItems.socialProof ? 'bg-emerald-50/50 border-emerald-200' : 'bg-stone-50 border-stone-200'
            }`}
          >
            {checkedItems.socialProof ? (
              <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
            )}
            <div className="text-xs">
              <span className="font-bold text-stone-900 block">Prueba Social con Fotos Reales</span>
              <p className="text-stone-600 mt-0.5">
                Mínimo 10 a 15 reseñas importadas con fotografías antes de encender cualquier anuncio en TikTok o Meta.
              </p>
            </div>
          </div>

          {/* Item 3 */}
          <div
            onClick={() => toggleCheck('shippingPolicy')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
              checkedItems.shippingPolicy ? 'bg-emerald-50/50 border-emerald-200' : 'bg-stone-50 border-stone-200'
            }`}
          >
            {checkedItems.shippingPolicy ? (
              <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
            )}
            <div className="text-xs">
              <span className="font-bold text-stone-900 block">Política de Envío Transparente en CLP</span>
              <p className="text-stone-600 mt-0.5">
                Plazo real explícito: <strong>15 a 25 días</strong> (si es AliExpress directo vía DSers) o <strong>24 a 72h</strong> (si es Dropi local). Incluye código de seguimiento web.
              </p>
            </div>
          </div>

          {/* Item 4 */}
          <div
            onClick={() => toggleCheck('returnsVisible')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
              checkedItems.returnsVisible ? 'bg-emerald-50/50 border-emerald-200' : 'bg-stone-50 border-stone-200'
            }`}
          >
            {checkedItems.returnsVisible ? (
              <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
            )}
            <div className="text-xs">
              <span className="font-bold text-stone-900 block">Garantía Visible en la Ficha</span>
              <p className="text-stone-600 mt-0.5">
                Política de garantía de satisfacción (30 días) visible directamente en la ficha del producto, no escondida en el footer.
              </p>
            </div>
          </div>

          {/* Item 5 - SERNAC */}
          <div
            onClick={() => toggleCheck('sernacUrgency')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 md:col-span-2 ${
              checkedItems.sernacUrgency ? 'bg-amber-50/70 border-amber-300' : 'bg-amber-50/40 border-amber-200'
            }`}
          >
            {checkedItems.sernacUrgency ? (
              <CheckSquare className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            )}
            <div className="text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-amber-950">Cumplimiento SERNAC: Urgencia Real (No Contadores Falsos)</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-200 text-amber-900 font-bold">Advertencia Legal</span>
              </div>
              <p className="text-amber-900 mt-0.5 leading-relaxed">
                Frases como &quot;quedan X unidades&quot; solo si reflejan inventario real. <strong>Los contadores de cuenta regresiva artificiales y recurrentes han sido objeto de sanciones del SERNAC</strong> en Chile bajo la ley de protección de derechos de los consumidores.
              </p>
            </div>
          </div>

          {/* Item 6 */}
          <div
            onClick={() => toggleCheck('checkoutSteps')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
              checkedItems.checkoutSteps ? 'bg-emerald-50/50 border-emerald-200' : 'bg-stone-50 border-stone-200'
            }`}
          >
            {checkedItems.checkoutSteps ? (
              <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
            )}
            <div className="text-xs">
              <span className="font-bold text-stone-900 block">Checkout de Máximo 3 Pasos con Logos Locales</span>
              <p className="text-stone-600 mt-0.5">
                Sellos visibles de Webpay Plus, Redcompra y Mercado Pago en la cabecera del checkout para reducir el abandono de carrito.
              </p>
            </div>
          </div>

          {/* Item 7 */}
          <div
            onClick={() => toggleCheck('webPerformance')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
              checkedItems.webPerformance ? 'bg-emerald-50/50 border-emerald-200' : 'bg-stone-50 border-stone-200'
            }`}
          >
            {checkedItems.webPerformance ? (
              <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
            )}
            <div className="text-xs">
              <span className="font-bold text-stone-900 block">Rendimiento Web & Mínimo de Apps</span>
              <p className="text-stone-600 mt-0.5">
                Imágenes comprimidas en formato WebP y no más de 3-4 apps accesorias en Shopify para asegurar carga en &lt; 2,5 segundos en conexiones móviles 4G/5G en Chile.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Legal & Tributario Chile */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="border-b border-stone-100 pb-3">
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-stone-700" />
            <span>Aspectos Legales y Tributarios en Chile (SII & Aduanas)</span>
          </h3>
          <p className="text-xs text-stone-500">
            Reglas de juego fiscales actualizadas a 2026 para operar de forma 100% blindada
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Formalización SII */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-stone-900 text-white flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Inicio de Actividades en el SII
              </h4>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">
              Realizar el trámite en <strong>sii.cl</strong> antes de la primera venta. Giro correspondiente: <em>&quot;Venta al por menor de productos n.c.p. por internet / Comercio electrónico minorista&quot;</em>.
            </p>
            <div className="p-2 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-800">
              <strong>Riesgo de informalidad:</strong> Operar con cuenta corriente personal sin formalizar gatilla riesgo de fiscalización retroactiva del SII y multas de hasta el 30% del impuesto eludido.
            </div>
          </div>

          {/* Régimen Pro Pyme 14 D N°3 */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-stone-900 text-white flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Régimen Tributario Pro Pyme General
              </h4>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">
              Primera Categoría, acogido al <strong>Art. 14 D N°3 de la Ley sobre Impuesto a la Renta</strong>. Permite tributar con la tasa reducida del <strong>12,5%</strong> vigente para el ejercicio 2026.
            </p>
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-800">
              <strong>Ventaja:</strong> Contabilidad simplificada basada en flujo de caja (ingresos percibidos menos gastos efectivamente pagados).
            </div>
          </div>

          {/* Documentos Tributarios: Boleta vs Factura */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-stone-900 text-white flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                DTEs: Boleta (39) vs Factura (33)
              </h4>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">
              Parte operando con <strong>Boleta Electrónica (DTE 39)</strong> para ventas a consumidor final. Habilita la <strong>Factura Electrónica (DTE 33)</strong> únicamente cuando un cliente empresa te lo solicite explícitamente ingresando su RUT societario.
            </p>
            <div className="text-[11px] text-stone-500">
              Ambos documentos se generan automáticamente si conectaste Bsale, OpenFactura o Haulmer a tu Shopify/Woo.
            </div>
          </div>

          {/* Régimen Aduanero Simplificado (< USD 500) */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-stone-900 text-white flex items-center justify-center font-bold text-xs">
                4
              </div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Aduana: Régimen Simplificado (&lt; USD 500)
              </h4>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">
              Las compras unitarias bajo <strong>USD 500</strong> (el caso normal en dropshipping) entran al régimen simplificado: <strong>solo pagan el 19% de IVA (Ley 21.713), sin arancel ad-valorem</strong>, porque plataformas como AliExpress están formalmente inscritas ante el SII.
            </p>
            <div className="text-[11px] text-stone-500">
              *El arancel del 6% solo aplica si consolidas compras sobre USD 500 en un mismo embarque (relevante solo si importas stock por mayor).
            </div>
          </div>
        </div>

        {/* Declaraciones F29 y F22 */}
        <div className="p-4 bg-stone-900 text-stone-200 rounded-xl text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-white">
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>Declaraciones Tributarias Periódicas Obligatorias:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-stone-800 p-3 rounded-lg border border-stone-700">
              <span className="font-bold text-amber-300 block mb-0.5">Formulario 29 (Mensual):</span>
              <p className="text-stone-300 text-[11px]">
                Declaras el débito fiscal (19% sobre el precio de venta en CLP) y descuentas como gasto/crédito el monto pagado al proveedor extranjero, incluyendo el 19% de IVA que ya te retuvieron en aduanas/AliExpress.
              </p>
            </div>
            <div className="bg-stone-800 p-3 rounded-lg border border-stone-700">
              <span className="font-bold text-amber-300 block mb-0.5">Formulario 22 (Anual - Operación Renta):</span>
              <p className="text-stone-300 text-[11px]">
                Se declara en abril de cada año. Tributas el 12,5% de impuesto sobre la utilidad líquida acumulada del negocio durante el ejercicio 2026.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
