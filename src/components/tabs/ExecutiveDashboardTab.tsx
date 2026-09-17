import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCLP, formatUSD } from '../../utils/calculator';
import { exportBlueprintPDF, exportBlueprintJSON } from '../../lib/pdf-exporter';
import { 
  FileDown, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Scale, 
  Truck, 
  Layers, 
  Building2, 
  Sparkles, 
  ArrowUpRight, 
  ShieldCheck, 
  Package, 
  Share2, 
  Calendar, 
  Check, 
  Clock, 
  CircleDollarSign, 
  ExternalLink,
  ChevronRight,
  Printer
} from 'lucide-react';

export const ExecutiveDashboardTab: React.FC = () => {
  const state = useApp();
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingJSON, setIsExportingJSON] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  // Handlers for export
  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    try {
      // Allow UI render state
      await new Promise((r) => setTimeout(r, 200));
      exportBlueprintPDF({
        state,
        documentTitle: 'BLUEPRINT OPERATIVO E-COMMERCE CHILE 2026',
        authorName: 'Comité de Operaciones E-commerce'
      });
      setShowExportSuccess(true);
      setTimeout(() => setShowExportSuccess(false), 4000);
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleDownloadJSON = () => {
    setIsExportingJSON(true);
    try {
      exportBlueprintJSON(state);
      setShowExportSuccess(true);
      setTimeout(() => setShowExportSuccess(false), 4000);
    } catch (err) {
      console.error('Error exporting JSON:', err);
    } finally {
      setIsExportingJSON(false);
    }
  };

  // Unit Economics and Markup
  const landedCLP = state.financialResult.landedCostCLP;
  const pvpCLP = state.salePriceCLP;
  const markupMultiplier = landedCLP > 0 ? (pvpCLP / landedCLP).toFixed(1) : '0';
  const netProfitCLP = state.financialResult.netProfitCLP;
  const netMarginPct = state.financialResult.netMarginPct;
  const isNetHealthy = netMarginPct >= 18;

  // Logistics calculations
  const volWeight = (state.boxLengthCm * state.boxWidthCm * state.boxHeightCm) / 4000;
  const is3PLRecommended = state.courierVolumeMonthly >= 350;
  const monthlySavingsCLP = state.fulfillmentModel === '3pl'
    ? Math.round(state.courierVolumeMonthly * 1350)
    : Math.round(state.courierVolumeMonthly * 650);

  // Timeline phases
  const timelineStages = [
    {
      id: 'step_spa',
      title: 'Constitución SpA & RUT SII',
      law: 'Empresa en un Día + Código 479100',
      description: 'Formalización de sociedad por acciones, apertura de e-RUT y enrolamiento en régimen Pro Pyme General (Art. 14 D N°3).',
      status: state.complianceChecked['spa_empresa_dia'] ? 'completed' : 'pending',
      actionTab: 'compliance'
    },
    {
      id: 'step_supplier',
      title: 'Certificación Proveedor & Catálogo',
      law: 'AliExpress Direct / CJdropshipping / Dropi',
      description: 'Inspección de calidad de muestras, verificación de packaging sin marca china y acuerdo de SLA de despacho < 48 hrs.',
      status: state.completedTasks['d1_t1'] && state.completedTasks['d2_t1'] ? 'completed' : 'in_progress',
      actionTab: 'nichos'
    },
    {
      id: 'step_gateway_courier',
      title: 'Integración Pasarela & Webhooks Courier',
      law: 'Transbank Webpay Plus + Blue Express API v2',
      description: 'Emisión automática de boletas electrónicas DTE 39 con Bsale/OpenFactura y despacho automatizado con etiqueta ZPL.',
      status: state.completedTasks['d3_t1'] ? 'completed' : 'pending',
      actionTab: 'stack'
    },
    {
      id: 'step_sernac',
      title: 'Políticas SERNAC & Garantía 6 Meses',
      law: 'Ley N° 19.496 de Protección al Consumidor',
      description: 'Publicación de términos legales en footer, derecho irrenunciable 3x3 (devolución, cambio o reparación) y logística inversa.',
      status: state.complianceChecked['sernac_garantia_6m'] ? 'completed' : 'pending',
      actionTab: 'landing_legal'
    },
    {
      id: 'step_ads',
      title: 'Encendido de Campañas Ads 2026',
      law: 'Meta Advantage+ & TikTok UGC Broad',
      description: 'Creativos verticales de alta retención, CAPI server-side activado y testing inicial de $10 USD/día en TikTok Ads.',
      status: state.completedTasks['d7_t1'] ? 'completed' : 'pending',
      actionTab: 'ads'
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* 1. Header Hero Ejecutivo */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-stone-800">
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Tab 6 • Consolidación & Auditoría Global Ejecutiva
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Dashboard de Lanzamiento & Plan Operativo 2026
            </h2>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
              Consolidación en tiempo real de los 5 pilares estratégicos: viabilidad financiera unitaria, compliance fiscal ante la Ley N° 21.713, arquitectura de última milla y hoja de ruta de implementación.
            </p>
          </div>

          {/* Botones de Exportación Rápida */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              id="btn-export-pdf"
              data-testid="btn-export-pdf"
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isExportingPDF ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  Compilando PDF...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  Descargar PDF Ejecutivo
                </>
              )}
            </button>

            <button
              id="btn-export-json"
              data-testid="btn-export-json"
              onClick={handleDownloadJSON}
              disabled={isExportingJSON}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-medium text-sm border border-stone-700 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4 text-stone-400" />
              Exportar JSON Técnico
            </button>
          </div>
        </div>

        {/* Notificación Flotante de Éxito */}
        {showExportSuccess && (
          <div data-testid="export-success-notification" className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Documento generado con éxito. La descarga comenzó automáticamente en tu navegador.</span>
          </div>
        )}
      </div>

      {/* 2. Resumen de Indicadores Clave (4 KPI Cards Principales) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Costo Landed vs PVP */}
        <div data-testid="kpi-card-landed" className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Unit Economics</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-xs text-stone-500">Costo Landed Unitario</div>
            <div data-testid="kpi-landed-value" className="text-2xl font-black text-stone-900 tracking-tight">
              {formatCLP(landedCLP)}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
              <span className="text-stone-500">PVP Sugerido:</span>
              <span data-testid="kpi-pvp-value" className="font-bold text-stone-800">{formatCLP(pvpCLP)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">Factor Markup:</span>
              <span className="font-semibold text-emerald-700">{markupMultiplier}x sobre costo</span>
            </div>
          </div>
        </div>

        {/* Card 2: Margen Neto & Breakeven ROAS */}
        <div data-testid="kpi-card-margin" className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Rentabilidad Neta</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isNetHealthy ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-xs text-stone-500">Margen Neto Unitario</div>
            <div data-testid="kpi-net-margin-value" className={`text-2xl font-black tracking-tight ${isNetHealthy ? 'text-emerald-600' : 'text-rose-600'}`}>
              {netMarginPct}% <span className="text-sm font-semibold">({formatCLP(netProfitCLP)})</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
              <span className="text-stone-500">ROAS de Equilibrio:</span>
              <span className="font-bold text-stone-800">{state.financialResult.breakevenRoas.toFixed(2)}x</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">Target ROAS Recomendado:</span>
              <span className="font-semibold text-amber-700">{state.financialResult.suggestedTargetRoas.toFixed(2)}x</span>
            </div>
          </div>
        </div>

        {/* Card 3: Cumplimiento Tributario Ley 21.713 */}
        <div data-testid="kpi-card-compliance" className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Compliance SII</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-xs text-stone-500">Estado de Cumplimiento</div>
            <div data-testid="kpi-compliance-value" className="text-2xl font-black text-blue-700 tracking-tight">
              {state.complianceScorePct}% <span className="text-xs font-medium text-stone-500">Conforme</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
              <span className="text-stone-500">Código de Actividad:</span>
              <span className="font-bold text-stone-800">{state.economicCode}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">Régimen Pro Pyme:</span>
              <span className="font-semibold text-stone-700">General (14 D N°3)</span>
            </div>
          </div>
        </div>

        {/* Card 4: Opción Logística Ganadora */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Estrategia Logística</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-xs text-stone-500">Modelo Óptimo ({state.courierVolumeMonthly} env/mes)</div>
            <div className="text-2xl font-black text-stone-900 tracking-tight">
              {state.fulfillmentModel === '3pl' ? '3PL Fulfillment' : 'In-House (Taller)'}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
              <span className="text-stone-500">Courier Seleccionado:</span>
              <span className="font-bold text-stone-800 uppercase">{state.selectedCourier}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">Ahorro Mensual Est.:</span>
              <span className="font-semibold text-emerald-700">{formatCLP(monthlySavingsCLP)}/mes</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Cronograma Visual de Lanzamiento & Compliance 2026 */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md mb-2">
              <Calendar className="w-3.5 h-3.5" />
              Ruta Crítica 2026
            </div>
            <h3 className="text-xl font-bold text-stone-900">
              Cronograma de Lanzamiento & Compliance Regulatorio
            </h3>
            <p className="text-stone-500 text-xs sm:text-sm">
              Secuencia obligatoria de hitos operativos para operar 100% formalizado y con alta rentabilidad comercial en Chile.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-500">Avance de Ruta:</span>
            <div className="w-32 bg-stone-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${state.sprintProgressPct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-stone-800">{state.sprintProgressPct}%</span>
          </div>
        </div>

        {/* Timeline visual interactivo */}
        <div className="space-y-4">
          {timelineStages.map((stage, idx) => {
            const isCompleted = stage.status === 'completed';
            const isInProgress = stage.status === 'in_progress';

            return (
              <div
                key={stage.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCompleted 
                    ? 'bg-emerald-50/40 border-emerald-200' 
                    : isInProgress
                    ? 'bg-amber-50/50 border-amber-200 ring-1 ring-amber-300'
                    : 'bg-stone-50/70 border-stone-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 ${
                    isCompleted 
                      ? 'bg-emerald-600 text-white' 
                      : isInProgress 
                      ? 'bg-amber-500 text-stone-950' 
                      : 'bg-stone-200 text-stone-600'
                  }`}>
                    {isCompleted ? <Check className="w-5 h-5" /> : idx + 1}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-stone-900">
                        {stage.title}
                      </h4>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white text-stone-600 border border-stone-200">
                        {stage.law}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-3xl">
                      {stage.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    isCompleted 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : isInProgress 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-stone-200 text-stone-700'
                  }`}>
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completado
                      </>
                    ) : isInProgress ? (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        En Ejecución
                      </>
                    ) : (
                      <>
                        <CircleDollarSign className="w-3.5 h-3.5" />
                        Pendiente
                      </>
                    )}
                  </span>

                  <button
                    onClick={() => state.setActiveTab(stage.actionTab)}
                    className="p-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 hover:border-stone-300 text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                    title="Ir a pestaña de configuración"
                  >
                    <span>Configurar</span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Resumen Ejecutivo de Unidad y Logística (Tabla Comparativa) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Detalle Financiero Unitario */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h4 className="text-base sm:text-lg font-bold text-stone-900">
                Estructura de Unit Economics por Pedido
              </h4>
              <p className="text-xs text-stone-500">
                Producto: <span className="font-semibold text-stone-700">{state.productName}</span> • Dólar: CLP ${state.exchangeRate}
              </p>
            </div>
            <button
              onClick={() => state.setActiveTab('calculadora')}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1"
            >
              Ajustar Parámetros <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-2.5">Concepto</th>
                  <th className="py-2.5 text-right">Monto USD</th>
                  <th className="py-2.5 text-right">Monto CLP</th>
                  <th className="py-2.5 text-right">% s/ PVP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                <tr>
                  <td className="py-2.5 font-medium">Costo Fábrica (FOB AliExpress/CJ)</td>
                  <td className="py-2.5 text-right font-mono">{formatUSD(state.supplierCostUSD)}</td>
                  <td className="py-2.5 text-right font-mono">{formatCLP(state.supplierCostUSD * state.exchangeRate)}</td>
                  <td className="py-2.5 text-right text-stone-500 font-mono">
                    {(( (state.supplierCostUSD * state.exchangeRate) / pvpCLP ) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium">Flete Aéreo Courier Internacional</td>
                  <td className="py-2.5 text-right font-mono">{formatUSD(state.shippingCostUSD)}</td>
                  <td className="py-2.5 text-right font-mono">{formatCLP(state.shippingCostUSD * state.exchangeRate)}</td>
                  <td className="py-2.5 text-right text-stone-500 font-mono">
                    {(( (state.shippingCostUSD * state.exchangeRate) / pvpCLP ) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr className="bg-stone-50/70 font-semibold text-stone-900">
                  <td className="py-2.5">Subtotal CIF (Proveedor + Flete)</td>
                  <td className="py-2.5 text-right font-mono">{formatUSD(state.financialResult.cifUSD)}</td>
                  <td className="py-2.5 text-right font-mono">{formatCLP(state.financialResult.cifUSD * state.exchangeRate)}</td>
                  <td className="py-2.5 text-right font-mono">
                    {(( (state.financialResult.cifUSD * state.exchangeRate) / pvpCLP ) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-amber-900 font-medium">
                    IVA 19% Importación (Ley N° 21.713)
                  </td>
                  <td className="py-2.5 text-right font-mono text-amber-900">{formatUSD(state.financialResult.iva19USD)}</td>
                  <td className="py-2.5 text-right font-mono text-amber-900">{formatCLP(state.financialResult.ivaF29CreditCLP)}</td>
                  <td className="py-2.5 text-right text-stone-500 font-mono">
                    {(( state.financialResult.ivaF29CreditCLP / pvpCLP ) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr className="bg-stone-100 font-bold text-stone-900">
                  <td className="py-2.5">Costo Landed Total Puesto en Chile</td>
                  <td className="py-2.5 text-right font-mono">{formatUSD(state.financialResult.landedCostUSD)}</td>
                  <td className="py-2.5 text-right font-mono">{formatCLP(landedCLP)}</td>
                  <td className="py-2.5 text-right font-mono">{((landedCLP / pvpCLP) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium">Comisión Pasarela Transbank/MP</td>
                  <td className="py-2.5 text-right font-mono">{formatUSD(state.financialResult.gatewayFeeCLP / state.exchangeRate)}</td>
                  <td className="py-2.5 text-right font-mono">{formatCLP(state.financialResult.gatewayFeeCLP)}</td>
                  <td className="py-2.5 text-right text-stone-500 font-mono">{state.financialResult.gatewayFeePct}%</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium">CPA Objetivo Ads (CAC Meta/TikTok)</td>
                  <td className="py-2.5 text-right font-mono">{formatUSD(state.financialResult.suggestedAdCpaCLP / state.exchangeRate)}</td>
                  <td className="py-2.5 text-right font-mono">{formatCLP(state.financialResult.suggestedAdCpaCLP)}</td>
                  <td className="py-2.5 text-right text-stone-500 font-mono">
                    {((state.financialResult.suggestedAdCpaCLP / pvpCLP) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr className="bg-emerald-50 text-emerald-950 font-black">
                  <td className="py-3">Utilidad Neta Final por Pedido (Net Profit)</td>
                  <td className="py-3 text-right font-mono">{formatUSD(netProfitCLP / state.exchangeRate)}</td>
                  <td className="py-3 text-right font-mono text-emerald-700">{formatCLP(netProfitCLP)}</td>
                  <td className="py-3 text-right font-mono text-emerald-700">{netMarginPct}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Columna Derecha: Tarjeta de Despacho & Courier */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h4 className="text-base font-bold text-stone-900">
                Setup Logístico 2026
              </h4>
              <button
                onClick={() => state.setActiveTab('logistica')}
                className="text-xs text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1"
              >
                Simular <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
                <div className="flex justify-between font-medium text-stone-700">
                  <span>Courier Asignado:</span>
                  <span className="font-bold text-stone-900 uppercase">{state.selectedCourier}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Volumen Proyectado:</span>
                  <span className="font-bold text-stone-800">{state.courierVolumeMonthly} envíos/mes</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Dimensiones Caja:</span>
                  <span className="font-mono text-stone-800">
                    {state.boxLengthCm}x{state.boxWidthCm}x{state.boxHeightCm} cm
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Peso Volumétrico:</span>
                  <span className="font-mono text-stone-800">{volWeight.toFixed(2)} kg (Div 4000)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 space-y-1.5">
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  Estrategia "Envío Gratis &gt; $29.990"
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Subsidio de flete estimado ($2.990 CLP) absorbido dentro del margen bruto mediante ofertas de packs dobles (x2) y cross-sells.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100">
            <button
              onClick={handleDownloadPDF}
              className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Reporte Completo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboardTab;
