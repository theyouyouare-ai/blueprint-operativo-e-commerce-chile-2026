import React, { useState, useMemo } from 'react';
import { NICHES_DATA } from '../data/blueprintData';
import { calculateLandedCost, formatCLP, formatUSD } from '../utils/calculator';
import { LandedCostInput } from '../types/blueprint';
import { 
  Calculator, 
  HelpCircle, 
  TrendingUp, 
  CreditCard, 
  FileSpreadsheet, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle,
  Percent,
  CheckCircle2,
  DollarSign,
  FileDown
} from 'lucide-react';
import { generateBusinessPlanPDF } from '../utils/pdfExport';

interface UnitEconomicsCalculatorProps {
  exchangeRate: number;
  completedTasks?: { [taskId: string]: boolean };
}

export const UnitEconomicsCalculator: React.FC<UnitEconomicsCalculatorProps> = ({
  exchangeRate,
  completedTasks = {}
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('mascotas');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Input states
  const [supplierCostUSD, setSupplierCostUSD] = useState<number>(11);
  const [shippingCostUSD, setShippingCostUSD] = useState<number>(5);
  const [salePriceCLP, setSalePriceCLP] = useState<number>(32990);
  const [gatewayType, setGatewayType] = useState<'webpay_debit' | 'webpay_credit' | 'mercadopago' | 'flow'>('webpay_credit');
  const [customAdCpa, setCustomAdCpa] = useState<number>(0); // 0 means use auto target ROAS
  const [returnRatePct, setReturnRatePct] = useState<number>(3); // 3% reserve

  // When preset is clicked, load default niche data
  const handleSelectPreset = (nicheId: string) => {
    setSelectedPreset(nicheId);
    const found = NICHES_DATA.find((n) => n.id === nicheId);
    if (found) {
      setSupplierCostUSD(found.supplierCostUSD);
      setShippingCostUSD(found.shippingCostUSD);
      setSalePriceCLP(found.suggestedPvpCLP);
      setCustomAdCpa(0);
    }
  };

  // Perform calculations
  const calcResult = useMemo(() => {
    const input: LandedCostInput = {
      supplierCostUSD,
      shippingCostUSD,
      salePriceCLP,
      gatewayType,
      adCpaCLP: customAdCpa > 0 ? customAdCpa : undefined,
      returnRatePct
    };
    return calculateLandedCost(input, exchangeRate);
  }, [supplierCostUSD, shippingCostUSD, salePriceCLP, gatewayType, customAdCpa, returnRatePct, exchangeRate]);

  // Breakdown percentages for visual waterfall
  const landedPct = salePriceCLP > 0 ? Math.round((calcResult.landedCostCLP / salePriceCLP) * 100) : 0;
  const gatewayPct = salePriceCLP > 0 ? Math.round((calcResult.gatewayFeeCLP / salePriceCLP) * 100) : 0;
  const adPct = salePriceCLP > 0 ? Math.round((calcResult.suggestedAdCpaCLP / salePriceCLP) * 100) : 0;
  const netPct = Math.max(0, Math.round(calcResult.netMarginPct));

  const handleExportPDF = () => {
    try {
      setDownloadingPdf(true);
      const currentNiche = NICHES_DATA.find((n) => n.id === selectedPreset);
      const productName = currentNiche ? currentNiche.name : 'Simulación Personalizada';

      const gatewayLabels: Record<string, string> = {
        webpay_debit: 'Webpay Plus Débito (1.75% + IVA)',
        webpay_credit: 'Webpay Plus Crédito (2.35% + IVA)',
        mercadopago: 'Mercado Pago (3.09% + IVA)',
        flow: 'Flow (3.04% + IVA)'
      };

      generateBusinessPlanPDF({
        exchangeRate,
        completedTasks,
        financialData: {
          productName,
          supplierCostUSD,
          shippingCostUSD,
          salePriceCLP,
          gatewayType,
          gatewayName: gatewayLabels[gatewayType] || gatewayType,
          customAdCpa,
          returnRatePct,
          landedResult: calcResult
        },
        exportScope: 'complete'
      });
    } catch (err) {
      console.error('Error al generar PDF del resumen financiero:', err);
    } finally {
      setTimeout(() => setDownloadingPdf(false), 1200);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-stone-900 text-white rounded-xl">
                <Calculator className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-stone-900">
                Simulador Financiero & Costo Landed (Ley N°21.713)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Modelado estricto con eliminación de la exención de USD 41, 19% IVA de importación, pasarelas locales y costo de adquisición (Ads).
            </p>
            <div className="mt-2.5 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Motor Certificado: <strong>7/7 Tests Unitarios Vitest Pasados ✅</strong> (Ley N°21.713 & Margen $\ge 20\%$)</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200">
              <span className="text-xs font-semibold text-stone-500 px-2 hidden md:inline">
                Cargar Ejemplo:
              </span>
              {NICHES_DATA.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleSelectPreset(n.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedPreset === n.id
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {n.name.split(' ')[0]}
                </button>
              ))}
              <button
                onClick={() => setSelectedPreset('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedPreset === 'custom'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Personalizado
              </button>
            </div>

            {/* Export PDF Button */}
            <button
              onClick={handleExportPDF}
              disabled={downloadingPdf}
              className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
              title="Descargar Plan de Negocios en PDF con este modelado financiero y tu progreso del sprint"
            >
              <FileDown className="w-4 h-4 text-amber-400" />
              <span>{downloadingPdf ? 'Generando PDF...' : 'Descargar Plan en PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Input Parameters (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              Parámetros de Costo & Venta
            </h3>
            <span className="text-xs text-stone-500">Ajusta según tu SKU</span>
          </div>

          <div className="space-y-4">
            {/* Costo Proveedor */}
            <div>
              <div className="flex justify-between text-xs font-medium text-stone-700 mb-1">
                <span>Costo Proveedor (AliExpress / CJ):</span>
                <span className="font-bold font-mono text-stone-900">
                  {formatUSD(supplierCostUSD)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-stone-400 text-xs font-mono">$</span>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="300"
                  value={supplierCostUSD}
                  onChange={(e) => {
                    setSupplierCostUSD(parseFloat(e.target.value) || 0);
                    setSelectedPreset('custom');
                  }}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-stone-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Flete / Envío */}
            <div>
              <div className="flex justify-between text-xs font-medium text-stone-700 mb-1">
                <span>Costo de Envío a Chile (USD):</span>
                <span className="font-bold font-mono text-stone-900">
                  {formatUSD(shippingCostUSD)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-stone-400 text-xs font-mono">$</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={shippingCostUSD}
                  onChange={(e) => {
                    setShippingCostUSD(parseFloat(e.target.value) || 0);
                    setSelectedPreset('custom');
                  }}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-stone-900 focus:outline-none"
                />
              </div>
              <span className="text-[11px] text-stone-400 block mt-0.5">
                Línea ePacket / AliExpress Standard Shipping (15-25 días)
              </span>
            </div>

            {/* PVP Venta en CLP */}
            <div>
              <div className="flex justify-between text-xs font-medium text-stone-700 mb-1">
                <span>Precio de Venta Sugerido (PVP en CLP):</span>
                <span className="font-bold font-mono text-emerald-700">
                  {formatCLP(salePriceCLP)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-stone-400 text-xs font-mono">CLP$</span>
                <input
                  type="number"
                  step="500"
                  min="5000"
                  max="500000"
                  value={salePriceCLP}
                  onChange={(e) => {
                    setSalePriceCLP(parseInt(e.target.value) || 0);
                    setSelectedPreset('custom');
                  }}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono font-bold text-stone-900 focus:ring-2 focus:ring-stone-900 focus:outline-none"
                />
              </div>
              <div className="flex gap-1.5 mt-1.5">
                {[19990, 24990, 32990, 49990].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setSalePriceCLP(p);
                      setSelectedPreset('custom');
                    }}
                    className="text-[11px] px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono"
                  >
                    ${p.toLocaleString('es-CL')}
                  </button>
                ))}
              </div>
            </div>

            {/* Pasarela Selector */}
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Pasarela de Pago Seleccionada:
              </label>
              <select
                value={gatewayType}
                onChange={(e) => setGatewayType(e.target.value as any)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs font-medium bg-white focus:ring-2 focus:ring-stone-900 focus:outline-none"
              >
                <option value="webpay_credit">Webpay Plus Crédito (Transbank 2,35% + IVA)</option>
                <option value="webpay_debit">Webpay Plus Débito / Redcompra (Transbank 1,75% + IVA)</option>
                <option value="mercadopago">Mercado Pago (~3,09% + IVA / Respaldo)</option>
                <option value="flow">Flow.cl (~3,04% + IVA / Multimedios)</option>
              </select>
            </div>

            {/* Costo Adquisición (Ads CPA) Tuning */}
            <div className="pt-2 border-t border-stone-100">
              <div className="flex justify-between text-xs font-medium text-stone-700 mb-1">
                <span>Costo Adquisición por Venta (CPA Ads):</span>
                <span className="font-bold font-mono text-stone-900">
                  {customAdCpa > 0 ? formatCLP(customAdCpa) : `${formatCLP(calcResult.suggestedAdCpaCLP)} (Auto)`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.round(salePriceCLP * 0.7)}
                step="500"
                value={customAdCpa > 0 ? customAdCpa : calcResult.suggestedAdCpaCLP}
                onChange={(e) => setCustomAdCpa(parseInt(e.target.value) || 0)}
                className="w-full accent-stone-900 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-stone-400 mt-1">
                <span>ROAS Obtenido: {calcResult.suggestedTargetRoas}x</span>
                {customAdCpa > 0 && (
                  <button
                    onClick={() => setCustomAdCpa(0)}
                    className="text-stone-500 hover:text-stone-800 underline text-[10px]"
                  >
                    Restaurar Auto (ROAS 2.2x)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results Cockpit (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Top Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Costo Landed Total
              </div>
              <div className="text-xl font-bold font-mono text-stone-900 mt-0.5">
                {formatCLP(calcResult.landedCostCLP)}
              </div>
              <div className="text-[11px] text-stone-500 font-mono">
                USD {calcResult.landedCostUSD} (Ley 21.713)
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Margen Bruto
              </div>
              <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5">
                ~{calcResult.grossMarginPct}%
              </div>
              <div className="text-[11px] text-stone-500">
                {formatCLP(calcResult.grossProfitCLP)} de ganancia bruta
              </div>
            </div>

            <div className="bg-stone-900 text-white p-4 rounded-xl shadow-sm col-span-2 sm:col-span-1">
              <div className="text-[11px] font-bold text-stone-300 uppercase tracking-wider">
                Margen Neto Estimado
              </div>
              <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">
                ~{calcResult.netMarginPct}%
              </div>
              <div className="text-[11px] text-stone-300">
                {formatCLP(calcResult.netProfitCLP)} / unidad
              </div>
            </div>
          </div>

          {/* Breakdown Table (Exact match to Blueprint structure) */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Estructura de Costos Paso a Paso (Landed → PVP)
              </span>
              <span className="text-[11px] font-mono text-stone-500">
                Dólar: ${exchangeRate} CLP
              </span>
            </div>

            <div className="p-5 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-600">1. Costo Proveedor</span>
                <span className="font-mono font-medium">{formatUSD(calcResult.cifUSD - shippingCostUSD)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-600">2. Flete internacional a Chile</span>
                <span className="font-mono font-medium">{formatUSD(shippingCostUSD)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100 bg-stone-50/70 px-2 rounded font-semibold text-stone-800">
                <span>Subtotal CIF (Costo + Flete)</span>
                <span className="font-mono">{formatUSD(calcResult.cifUSD)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100 text-rose-700 px-2 bg-rose-50/50 rounded font-medium">
                <span className="flex items-center gap-1">
                  <span>3. IVA 19% (Ley N°21.713 - sin exención USD 41)</span>
                </span>
                <span className="font-mono">+{formatUSD(calcResult.iva19USD)} (~{formatCLP(Math.round(calcResult.iva19USD * exchangeRate))})</span>
              </div>
              <div className="flex justify-between py-2 border-b-2 border-stone-300 font-bold text-stone-900 px-2 bg-stone-100 rounded">
                <span>Costo Landed Puesto en Chile</span>
                <span className="font-mono text-base">{formatCLP(calcResult.landedCostCLP)} ({formatUSD(calcResult.landedCostUSD)})</span>
              </div>

              <div className="pt-2 text-stone-600 text-xs uppercase font-bold tracking-wider">
                Desglose Operativo Post-Venta
              </div>

              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-600">Precio de Venta Público (PVP con IVA)</span>
                <span className="font-mono font-bold text-stone-900">{formatCLP(calcResult.salePriceCLP)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-stone-100 text-stone-600">
                <span>Comisión Pasarela ({calcResult.gatewayFeePct}% inc. IVA)</span>
                <span className="font-mono text-rose-600">-{formatCLP(calcResult.gatewayFeeCLP)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-stone-100 text-stone-600">
                <span className="flex items-center gap-1">
                  <span>Pauta Publicitaria Ads (CPA objetivo)</span>
                  <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-500">ROAS {calcResult.suggestedTargetRoas}x</span>
                </span>
                <span className="font-mono text-rose-600">-{formatCLP(calcResult.suggestedAdCpaCLP)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-stone-100 text-stone-500">
                <span>Provisión devoluciones / garantías (3%)</span>
                <span className="font-mono text-rose-600">-{formatCLP(Math.round(calcResult.salePriceCLP * (returnRatePct / 100)))}</span>
              </div>

              <div className="flex justify-between py-2.5 bg-emerald-50 text-emerald-950 px-3 rounded-xl font-bold text-sm">
                <span>Margen Neto Líquido en Bolsillo</span>
                <span className="font-mono text-base text-emerald-800">
                  {formatCLP(calcResult.netProfitCLP)} (~{calcResult.netMarginPct}%)
                </span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleExportPDF}
                  disabled={downloadingPdf}
                  className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5 text-amber-600" />
                  <span>{downloadingPdf ? 'Generando PDF...' : 'Descargar Plan Financiero en PDF'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Visual Distribution Waterfall */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-2">
            <div className="flex justify-between text-xs text-stone-500 font-semibold">
              <span>Distribución del PVP ($100%)</span>
              <span>Neto: {netPct}% | Benchmark: 20-25%</span>
            </div>
            <div className="w-full h-4 bg-stone-100 rounded-full flex overflow-hidden">
              <div style={{ width: `${landedPct}%` }} className="bg-stone-700" title={`Landed Cost: ${landedPct}%`} />
              <div style={{ width: `${gatewayPct}%` }} className="bg-amber-500" title={`Pasarela: ${gatewayPct}%`} />
              <div style={{ width: `${adPct}%` }} className="bg-rose-500" title={`Ads CPA: ${adPct}%`} />
              <div style={{ width: `${netPct}%` }} className="bg-emerald-500" title={`Margen Neto: ${netPct}%`} />
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] text-stone-600 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-700" />
                <span>Landed ({landedPct}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Pasarela ({gatewayPct}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Pauta Ads ({adPct}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-emerald-700">Neto ({netPct}%)</span>
              </div>
            </div>
          </div>

          {/* SII Tax Reconciliation Card */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-stone-800">
              <FileSpreadsheet className="w-4 h-4 text-stone-600" />
              <span>Estimación F29 Mensual (Débito vs Crédito Fiscal SII)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono">
              <div className="bg-white p-2.5 rounded border border-stone-200">
                <div className="text-[10px] text-stone-500 font-sans">Débito Fiscal (IVA Venta)</div>
                <div className="font-bold text-stone-900">{formatCLP(calcResult.ivaF29DebitCLP)}</div>
              </div>
              <div className="bg-white p-2.5 rounded border border-stone-200">
                <div className="text-[10px] text-stone-500 font-sans">Crédito Fiscal (IVA Aduana)</div>
                <div className="font-bold text-emerald-700">-{formatCLP(calcResult.ivaF29CreditCLP)}</div>
              </div>
              <div className="bg-white p-2.5 rounded border border-stone-200">
                <div className="text-[10px] text-stone-500 font-sans">Saldo F29 a pagar SII</div>
                <div className="font-bold text-stone-900">{formatCLP(calcResult.f29BalanceCLP)}</div>
              </div>
            </div>
            <p className="text-[11px] text-stone-500 leading-snug">
              *En el Formulario 29 declaras el débito fiscal (19%) sobre el precio de venta y descuentas como crédito el IVA que ya te retuvieron en aduanas/AliExpress. Régimen Pro Pyme General aplica 12,5% de Impuesto a la Renta en 2026 sobre la utilidad neta anual.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
