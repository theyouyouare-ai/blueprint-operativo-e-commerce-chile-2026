import React, { useState, useMemo, useEffect } from 'react';
import { NICHES_DATA } from '../../data/blueprintData';
import { useApp } from '../../context/AppContext';
import { 
  calculateUnitEconomics, 
  ACQUISITION_CHANNELS, 
  AcquisitionChannel,
  UnitEconomicsOutput
} from '../../lib/financial-engine';
import { formatCLP, formatUSD } from '../../utils/calculator';
import { 
  Sparkles, 
  Search, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle,
  Lightbulb, 
  Check, 
  ShoppingBag,
  ArrowRight,
  Calculator,
  Layers,
  Scale,
  DollarSign,
  BarChart3,
  Target,
  Truck,
  Building2,
  CheckCircle2,
  Sliders,
  HelpCircle
} from 'lucide-react';

interface NicheValidationTabProps {
  exchangeRate: number;
  onSelectNicheForCalc?: (nicheId: string) => void;
}

export const NicheValidationTab: React.FC<NicheValidationTabProps> = ({
  exchangeRate,
  onSelectNicheForCalc
}) => {
  const app = useApp();

  // 1. Niche Selection State
  const [selectedNicheId, setSelectedNicheId] = useState<string>(app.selectedNicheId || 'mascotas');
  const activeNiche = useMemo(() => {
    return NICHES_DATA.find((n) => n.id === selectedNicheId) || NICHES_DATA[0];
  }, [selectedNicheId]);

  // 2. Interactive Calculator Inputs State (pre-filled with selected niche defaults or AppContext)
  const [fobUSD, setFobUSD] = useState<number>(app.supplierCostUSD ?? activeNiche.supplierCostUSD);
  const [shippingUSD, setShippingUSD] = useState<number>(app.shippingCostUSD ?? activeNiche.shippingCostUSD);
  const [selectedChannel, setSelectedChannel] = useState<AcquisitionChannel>('tiktok_ads');
  const [customCacCLP, setCustomCacCLP] = useState<number>(ACQUISITION_CHANNELS.tiktok_ads.recommendedCAC_CLP);
  const [localDeliveryCLP, setLocalDeliveryCLP] = useState<number>(3800);
  const [targetMarginPct, setTargetMarginPct] = useState<number>(22);
  const [manualPvpCLP, setManualPvpCLP] = useState<number>(activeNiche.suggestedPvpCLP);
  const [useManualPvp, setUseManualPvp] = useState<boolean>(false);
  const [fixedCostsMonthlyCLP, setFixedCostsMonthlyCLP] = useState<number>(1000000);

  // 3. Customer Negative Review Hook Generator State
  const [customDefect, setCustomDefect] = useState<string>('');
  const [transformedHook, setTransformedHook] = useState<string>('');

  // Handle niche change & update defaults
  const handleSelectNiche = (nicheId: string) => {
    setSelectedNicheId(nicheId);
    app.setSelectedNicheId(nicheId);
    const n = NICHES_DATA.find((item) => item.id === nicheId);
    if (n) {
      setFobUSD(n.supplierCostUSD);
      setShippingUSD(n.shippingCostUSD);
      setManualPvpCLP(n.suggestedPvpCLP);
      app.setSupplierCostUSD(n.supplierCostUSD);
      app.setShippingCostUSD(n.shippingCostUSD);
      app.setSalePriceCLP(n.suggestedPvpCLP);
      
      // Select appropriate channel benchmark
      let channel: AcquisitionChannel = 'tiktok_ads';
      if (n.id === 'belleza') channel = 'meta_ads';
      if (n.id === 'hogar') channel = 'meta_ads';
      if (n.id === 'tecnologia') channel = 'google_shopping';
      
      setSelectedChannel(channel);
      setCustomCacCLP(ACQUISITION_CHANNELS[channel].recommendedCAC_CLP);
    }
    if (onSelectNicheForCalc) {
      onSelectNicheForCalc(nicheId);
    }
  };

  const handleChannelChange = (channelKey: AcquisitionChannel) => {
    setSelectedChannel(channelKey);
    setCustomCacCLP(ACQUISITION_CHANNELS[channelKey].recommendedCAC_CLP);
  };

  const handleTransformDefect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDefect.trim()) return;
    setTransformedHook(
      `"A diferencia de otros modelos donde el cliente en Chile se queja de que '${customDefect}', el nuestro incluye [garantía legal 6 meses SERNAC / enchufe chileno certificado / despacho express 24-72h] para que compres con total tranquilidad."`
    );
  };

  // 4. Pure Financial Engine Calculation
  const financialResult: UnitEconomicsOutput = useMemo(() => {
    return calculateUnitEconomics({
      supplierCostUSD: fobUSD,
      shippingCostUSD: shippingUSD,
      localDeliveryCLP,
      adChannel: selectedChannel,
      customCacCLP,
      targetNetMarginPct: targetMarginPct,
      gatewayFeePct: 3.51,
      exchangeRate,
      manualPvpCLP: useManualPvp ? manualPvpCLP : undefined,
      fixedCostsMonthlyCLP
    });
  }, [
    fobUSD,
    shippingUSD,
    localDeliveryCLP,
    selectedChannel,
    customCacCLP,
    targetMarginPct,
    useManualPvp,
    manualPvpCLP,
    fixedCostsMonthlyCLP,
    exchangeRate
  ]);

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-2 bg-stone-900 text-white rounded-xl">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Tab 3: Nichos de Alta Rentabilidad & Unit Economics (Chile 2026)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 max-w-3xl leading-relaxed">
              Matriz estratégica de 4 categorías validadas en el mercado local chileno bajo la <strong>Ley N° 21.713</strong> (19% IVA sin excepción de US$ 41). Simula costos landed, rentabilidad neta mínima ($\ge$ 20%) y punto de equilibrio operativo antes de gastar en pauta.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-stone-100 p-2 rounded-xl border border-stone-200 text-xs text-stone-700">
            <span className="font-medium text-stone-500">Tasa de Cambio:</span>
            <span className="font-mono font-bold text-stone-900">USD 1 = CLP ${exchangeRate}</span>
          </div>
        </div>
      </div>

      {/* 2. 4 Niche Selector Grid */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
            <Layers className="w-4 h-4 text-stone-800" />
            <span>Selecciona un Nicho para Cargar Parámetros de Mercado</span>
          </h3>
          <span className="text-xs text-stone-500 font-mono hidden sm:inline">
            4 Categorías Analizadas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {NICHES_DATA.map((niche) => {
            const isSelected = selectedNicheId === niche.id;
            const cifUSD = niche.supplierCostUSD + niche.shippingCostUSD;
            const landedCLP = Math.round(cifUSD * 1.19 * exchangeRate + 3800);
            const grossMargin = Math.round(((niche.suggestedPvpCLP - landedCLP) / niche.suggestedPvpCLP) * 100);

            return (
              <div
                key={niche.id}
                onClick={() => handleSelectNiche(niche.id)}
                className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-2 ring-stone-900/30'
                    : 'bg-white text-stone-800 border-stone-200 hover:border-stone-300 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-stone-800 text-amber-300 border border-stone-700'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {niche.badge}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      ~{grossMargin}% Bruto
                    </span>
                  </div>

                  <h4 className="text-base font-bold tracking-tight mb-1">
                    {niche.name}
                  </h4>

                  <p className={`text-xs line-clamp-2 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                    {niche.whyWorks2026}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-700/40 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={isSelected ? 'text-stone-400' : 'text-stone-500'}>Volumen CL:</span>
                    <span className="font-semibold">{niche.searchVolumeMonthCL || '50.000+/mes'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={isSelected ? 'text-stone-400' : 'text-stone-500'}>PVP Sugerido:</span>
                    <span className="font-mono font-bold text-amber-300">{formatCLP(niche.suggestedPvpCLP)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={isSelected ? 'text-stone-400' : 'text-stone-500'}>Canal Recomendado:</span>
                    <span className="font-semibold">{niche.primaryChannel || 'Meta Ads'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Deep-Dive Metrics Cards on the Active Niche */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Diagnóstico Cuantitativo del Nicho Seleccionado
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-stone-900">
              {activeNiche.name}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200">
              Canal: <strong>{activeNiche.primaryChannel || 'Meta Ads'}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200">
              Competencia: <strong>{activeNiche.competitionLevel || 'Media'}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Precio Promedio Mercado: <strong>{formatCLP(activeNiche.marketAveragePriceCLP || activeNiche.suggestedPvpCLP)}</strong>
            </span>
          </div>
        </div>

        {/* Drivers and Winning Entry Products */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>Tesis de Demanda en Chile (Septiembre 2026)</span>
            </h4>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-100">
              {activeNiche.whyWorks2026}
            </p>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-stone-700 block">Factores Catalizadores:</span>
              {activeNiche.demandDrivers.map((driver, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-stone-600">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{driver}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-stone-700" />
              <span>Productos de Entrada Típicos (SKUs Ganadores)</span>
            </h4>
            <div className="space-y-2">
              {activeNiche.entryProducts.map((prod, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs font-medium text-stone-800"
                >
                  <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center font-mono text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <span>{prod}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3-Step Validation Protocol */}
        <div className="pt-4 border-t border-stone-100">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-stone-700" />
              <span>Protocolo de Validación de Demanda en 3 Pasos (Obligatorio antes de Ads)</span>
            </h4>
            <p className="text-xs text-stone-500 mt-0.5">
              Ejecutar en este orden riguroso para verificar demanda orgánica, tracción publicitaria y objeciones de clientes locales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-stone-900 text-white flex items-center justify-center text-xs font-bold font-mono">
                  1
                </span>
                <span className="text-xs font-bold text-stone-900">Volumen de Búsqueda</span>
              </div>
              <p className="text-xs text-stone-600">
                Google Trends Chile + &quot;Más Vendidos&quot; en Mercado Libre para medir si la búsqueda no decae.
              </p>
              <div className="p-2 bg-white rounded border border-stone-200 text-[11px] font-mono text-stone-700">
                🔍 {activeNiche.validationChecklist.trendsTerm}
              </div>
              <div className="text-[10px] text-stone-500">
                Categoría MeLi: {activeNiche.validationChecklist.meliCategory}
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-stone-900 text-white flex items-center justify-center text-xs font-bold font-mono">
                  2
                </span>
                <span className="text-xs font-bold text-stone-900">Intensidad Publicitaria</span>
              </div>
              <p className="text-xs text-stone-600">
                Minea / TrendTrack: ver anuncios activos. Señal de que el mercado ya lo validó, no que está &quot;quemado&quot;.
              </p>
              <div className="p-2 bg-white rounded border border-stone-200 text-[11px] text-stone-700">
                📊 {activeNiche.validationChecklist.competitorIntensity}
              </div>
              <div className="text-[10px] text-emerald-700 font-medium">
                ✔ Si hay competidores gastando pauta continua en Chile, hay ventas reales.
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-stone-900 text-white flex items-center justify-center text-xs font-bold font-mono">
                  3
                </span>
                <span className="text-xs font-bold text-stone-900">Voz del Cliente & Objeciones</span>
              </div>
              <p className="text-xs text-stone-600">
                Reseñas de 1-3 estrellas en AliExpress/Amazon: ahí están los defectos que tu oferta debe resolver de entrada.
              </p>
              <div className="space-y-1 pt-1">
                {activeNiche.validationChecklist.customerPainPointsToSolve.map((pain, i) => (
                  <div key={i} className="text-[11px] bg-rose-50 text-rose-800 p-1.5 rounded border border-rose-100 flex items-start gap-1">
                    <span className="font-bold">⚠️</span>
                    <span>{pain}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Objection-to-Hook Generator */}
        <div className="pt-4 border-t border-stone-100 bg-amber-50/40 p-4 rounded-xl border border-amber-200/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Generador de Ángulo Publicitario (Objeción → Gancho de Venta en Chile)</span>
          </h4>
          <p className="text-xs text-stone-600 mb-3">
            Escribe una queja frecuente detectada en reseñas y transfórmala en el guión de apertura de tu anuncio:
          </p>

          <form onSubmit={handleTransformDefect} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={customDefect}
              onChange={(e) => setCustomDefect(e.target.value)}
              placeholder="Ej: El cargador se calienta mucho o el manual viene solo en chino..."
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition-colors shrink-0"
            >
              Generar Gancho para Video
            </button>
          </form>

          {transformedHook && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-amber-300 text-xs text-stone-800 font-medium leading-relaxed">
              <span className="font-bold text-amber-900 block mb-1">Gancho Recomendado para UGC / TikTok:</span>
              <p className="italic text-stone-700">{transformedHook}</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Interactive Unit Economics Calculator */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-400 text-stone-950 rounded-lg">
                <Calculator className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-bold text-stone-900">
                Calculadora Interactiva de Unit Economics (Normativa Chile Ley N° 21.713)
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Desglose matemáticamente auditado: Costo Landed CIF + IVA 19% + Pasarela 3.51% + CAC para asegurar un margen neto $\ge 20\%$.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFobUSD(activeNiche.supplierCostUSD);
                setShippingUSD(activeNiche.shippingCostUSD);
                setLocalDeliveryCLP(3800);
                setUseManualPvp(false);
                setTargetMarginPct(22);
              }}
              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors"
            >
              Restablecer Valores del Nicho
            </button>
          </div>
        </div>

        {/* Inputs & Outputs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4 bg-stone-50/70 p-4 sm:p-5 rounded-xl border border-stone-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-stone-800" />
              <span>Parámetros de Entrada</span>
            </h4>

            {/* FOB Input */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="font-semibold text-stone-700">Costo FOB en Origen (USD)</label>
                <span className="font-mono text-stone-500">${formatCLP(Math.round(fobUSD * exchangeRate))}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-stone-400 text-xs font-mono">USD $</span>
                <input
                  id="input-fob-usd"
                  data-testid="input-fob-usd"
                  type="number"
                  step="0.5"
                  min="0"
                  value={fobUSD}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    setFobUSD(val);
                    app.setSupplierCostUSD(val);
                  }}
                  className="w-full pl-14 pr-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                />
              </div>
            </div>

            {/* Shipping Input */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="font-semibold text-stone-700">Flete Internacional + Seguro (USD)</label>
                <span className="font-mono text-stone-500">${formatCLP(Math.round(shippingUSD * exchangeRate))}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-stone-400 text-xs font-mono">USD $</span>
                <input
                  id="input-shipping-usd"
                  data-testid="input-shipping-usd"
                  type="number"
                  step="0.5"
                  min="0"
                  value={shippingUSD}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    setShippingUSD(val);
                    app.setShippingCostUSD(val);
                  }}
                  className="w-full pl-14 pr-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                />
              </div>
            </div>

            {/* Acquisition Channel Selector */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Canal de Tráfico & Pauta</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(ACQUISITION_CHANNELS) as AcquisitionChannel[]).map((key) => {
                  const ch = ACQUISITION_CHANNELS[key];
                  const isSelected = selectedChannel === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleChannelChange(key)}
                      className={`p-2 rounded-lg text-left text-xs transition-all border ${
                        isSelected
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <span className="block font-bold text-[11px] truncate">{ch.name.split('(')[0]}</span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-amber-300' : 'text-stone-500'}`}>
                        CAC: {formatCLP(ch.recommendedCAC_CLP)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom CAC Input */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="font-semibold text-stone-700">CAC Proyectado (Costo por Compra)</label>
                <span className="font-mono text-stone-500">{formatUSD(customCacCLP / exchangeRate)}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-stone-400 text-xs font-mono">CLP $</span>
                <input
                  type="number"
                  step="100"
                  min="0"
                  value={customCacCLP}
                  onChange={(e) => setCustomCacCLP(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full pl-14 pr-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                />
              </div>
            </div>

            {/* Local Delivery and Margin Sliders */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Última Milla (Chile)
                </label>
                <input
                  type="number"
                  step="100"
                  value={localDeliveryCLP}
                  onChange={(e) => setLocalDeliveryCLP(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-stone-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Margen Neto Meta (%)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={targetMarginPct}
                    onChange={(e) => setTargetMarginPct(Math.max(5, Math.min(50, parseInt(e.target.value) || 20)))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-stone-300 bg-white"
                  />
                  <span className="text-xs font-bold text-stone-500">%</span>
                </div>
              </div>
            </div>

            {/* Manual vs Automatic PVP Toggle */}
            <div className="pt-2 border-t border-stone-200">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={useManualPvp}
                    onChange={(e) => setUseManualPvp(e.target.checked)}
                    className="rounded text-stone-900 focus:ring-0"
                  />
                  <span>Fijar Precio Manualmente</span>
                </label>
                {useManualPvp && (
                  <span className="text-[10px] text-stone-500">Editando PVP</span>
                )}
              </div>

              {useManualPvp ? (
                <div className="relative">
                  <span className="absolute left-3 top-2 text-stone-400 text-xs font-mono">CLP $</span>
                  <input
                    type="number"
                    step="500"
                    value={manualPvpCLP}
                    onChange={(e) => setManualPvpCLP(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full pl-14 pr-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-amber-400 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                  />
                </div>
              ) : (
                <div className="p-2 bg-amber-100/60 rounded-lg text-[11px] text-amber-900 flex items-center justify-between">
                  <span>PVP Calculado Automáticamente:</span>
                  <strong className="font-mono">{formatCLP(financialResult.suggestedPvpCLP)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Outputs Column (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] font-semibold text-stone-500 uppercase block">Costo Landed Total</span>
                <span className="text-sm sm:text-base font-bold font-mono text-stone-900 block mt-0.5">
                  {formatCLP(financialResult.landed.totalLandedCLP)}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  {formatUSD(financialResult.landed.landedCostUSD)}
                </span>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] font-semibold text-stone-500 uppercase block">PVP Efectivo</span>
                <span className="text-sm sm:text-base font-bold font-mono text-stone-900 block mt-0.5">
                  {formatCLP(financialResult.effectivePvpCLP)}
                </span>
                <span className="text-[10px] text-stone-500">IVA incl. (Boleta 39)</span>
              </div>

              <div className={`p-3 rounded-xl border ${
                financialResult.netMarginPct >= 20
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : financialResult.netMarginPct >= 10
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <span className="text-[10px] font-semibold uppercase block">Margen Neto Unitario</span>
                <span className="text-sm sm:text-base font-bold font-mono block mt-0.5">
                  {formatCLP(financialResult.netProfitCLP)}
                </span>
                <span className="text-[10px] font-bold">
                  {financialResult.netMarginPct}% del PVP
                </span>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] font-semibold text-stone-500 uppercase block">ROAS Breakeven</span>
                <span className="text-sm sm:text-base font-bold font-mono text-stone-900 block mt-0.5">
                  {financialResult.breakevenRoas}x
                </span>
                <span className="text-[10px] text-stone-500">Target: {financialResult.targetRoas}x</span>
              </div>
            </div>

            {/* Detailed Cost Breakdown Table */}
            <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-stone-100/70 px-3 py-2 font-bold text-stone-800 flex items-center justify-between">
                <span>Estructura Unitaria de Costos e Impuestos</span>
                <span className="text-[11px] text-stone-500 font-mono">% sobre PVP</span>
              </div>

              <div className="divide-y divide-stone-200/70 bg-white">
                <div className="px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>1. Costo FOB Fábrica (USD {fobUSD})</span>
                  </div>
                  <div className="text-right font-mono">
                    <span>{formatCLP(Math.round(fobUSD * exchangeRate))}</span>
                    <span className="text-stone-400 ml-2">
                      {Math.round((Math.round(fobUSD * exchangeRate) / financialResult.effectivePvpCLP) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    <span>2. Flete Internacional + Seguro (USD {shippingUSD})</span>
                  </div>
                  <div className="text-right font-mono">
                    <span>{formatCLP(Math.round(shippingUSD * exchangeRate))}</span>
                    <span className="text-stone-400 ml-2">
                      {Math.round((Math.round(shippingUSD * exchangeRate) / financialResult.effectivePvpCLP) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="px-3 py-2 flex items-center justify-between bg-stone-50/50">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>3. Arancel Aduanero (6% Ad-Valorem)</span>
                    {financialResult.landed.cifUSD <= 500 && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-medium">
                        Exento $\le$ US$ 500
                      </span>
                    )}
                  </div>
                  <div className="text-right font-mono">
                    <span>{formatCLP(financialResult.landed.tariffCLP)}</span>
                    <span className="text-stone-400 ml-2">
                      {Math.round((financialResult.landed.tariffCLP / financialResult.effectivePvpCLP) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="px-3 py-2 flex items-center justify-between bg-amber-50/50">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span className="font-semibold text-amber-950">4. IVA Importación 19% (Ley N° 21.713)</span>
                  </div>
                  <div className="text-right font-mono font-bold text-amber-950">
                    <span>{formatCLP(financialResult.landed.ivaImportCLP)}</span>
                    <span className="text-stone-500 ml-2">
                      {Math.round((financialResult.landed.ivaImportCLP / financialResult.effectivePvpCLP) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span>5. Despacho Última Milla (Chile)</span>
                  </div>
                  <div className="text-right font-mono">
                    <span>{formatCLP(localDeliveryCLP)}</span>
                    <span className="text-stone-400 ml-2">
                      {Math.round((localDeliveryCLP / financialResult.effectivePvpCLP) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="px-3 py-2 flex items-center justify-between bg-stone-100/50 font-bold">
                  <span>Subtotal Costo Landed Puesto en Chile</span>
                  <span className="font-mono text-stone-900">
                    {formatCLP(financialResult.landed.totalLandedCLP)}
                  </span>
                </div>

                <div className="px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span>6. Pauta Publicitaria / CAC ({ACQUISITION_CHANNELS[selectedChannel].name.split('(')[0]})</span>
                  </div>
                  <div className="text-right font-mono">
                    <span>{formatCLP(financialResult.cacCLP)}</span>
                    <span className="text-stone-400 ml-2">
                      {Math.round((financialResult.cacCLP / financialResult.effectivePvpCLP) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    <span>7. Pasarela de Pago (Webpay / Mercado Pago ~3.51%)</span>
                  </div>
                  <div className="text-right font-mono">
                    <span>{formatCLP(financialResult.gatewayFeeCLP)}</span>
                    <span className="text-stone-400 ml-2">3.5%</span>
                  </div>
                </div>

                {/* Final Margin Verdict Row */}
                <div className={`px-3 py-2.5 flex items-center justify-between font-bold ${
                  financialResult.netMarginPct >= 20
                    ? 'bg-emerald-100/70 text-emerald-950'
                    : financialResult.netMarginPct >= 10
                    ? 'bg-amber-100/70 text-amber-950'
                    : 'bg-rose-100/70 text-rose-950'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {financialResult.netMarginPct >= 20 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    )}
                    <span>Ganancia Neta por Unidad (EBITDA)</span>
                  </div>
                  <div className="text-right font-mono text-sm">
                    <span>{formatCLP(financialResult.netProfitCLP)}</span>
                    <span className="ml-2">({financialResult.netMarginPct}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Margin Verdict Banner */}
            {financialResult.netMarginPct < 20 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Alerta de Margen Objetivo (&lt; 20%):</span>
                  <p className="leading-relaxed">
                    Tu margen neto estimado es del <strong>{financialResult.netMarginPct}%</strong>. Para alcanzar el benchmark del 20%-25% en Chile, te sugerimos elevar el PVP a <strong>{formatCLP(financialResult.suggestedPvpCLP)}</strong> o buscar un flete consolidado inferior a US$ {Math.max(1, shippingUSD - 1.5).toFixed(1)}.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Break-Even Analysis Component (Table / Scenario Matrix) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-stone-900 text-white rounded-lg">
                <Target className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-bold text-stone-900">
                Punto de Equilibrio (Break-even) y Proyección de Escala Mensual
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Cálculo de unidades requeridas para absorber la infraestructura fija de la tienda (hosting, apps de Shopify/Next.js y facturación electrónica DTE).
            </p>
          </div>

          {/* Fixed Costs Input */}
          <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
            <span className="text-xs font-semibold text-stone-600 whitespace-nowrap">Costos Fijos / Mes:</span>
            <div className="flex items-center gap-1 font-mono text-xs">
              <span>$</span>
              <input
                type="number"
                step="50000"
                value={fixedCostsMonthlyCLP}
                onChange={(e) => setFixedCostsMonthlyCLP(Math.max(100000, parseInt(e.target.value) || 0))}
                className="w-28 px-2 py-1 text-xs font-bold font-mono rounded border border-stone-300 bg-white"
              />
              <span className="text-stone-400">CLP</span>
            </div>
          </div>
        </div>

        {/* Break-Even Hero Metric */}
        <div className="bg-stone-900 text-white rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-xs uppercase tracking-wider text-amber-300 font-semibold">
              Umbral Mínimo de Supervivencia Operativa
            </span>
            <h4 className="text-base sm:text-lg font-bold">
              Necesitas vender <strong>{financialResult.breakevenUnitsMonthly} unidades al mes</strong> para no perder dinero
            </h4>
            <p className="text-xs text-stone-400">
              A partir de la unidad {financialResult.breakevenUnitsMonthly + 1}, cada venta genera{' '}
              <strong className="text-emerald-400 font-mono">{formatCLP(financialResult.netProfitCLP)}</strong> de ganancia neta pura.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center px-4 py-2 bg-stone-800 rounded-lg border border-stone-700">
              <span className="text-[10px] text-stone-400 block uppercase">Unidades Break-even</span>
              <span className="text-2xl font-bold font-mono text-amber-300">
                {financialResult.breakevenUnitsMonthly}
              </span>
            </div>
            <div className="text-center px-4 py-2 bg-stone-800 rounded-lg border border-stone-700">
              <span className="text-[10px] text-stone-400 block uppercase">Facturación Mínima</span>
              <span className="text-lg font-bold font-mono text-white">
                {formatCLP(financialResult.monthlyTargetRevenueCLP)}
              </span>
            </div>
          </div>
        </div>

        {/* Scenario Table */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-stone-800" />
              <span>Matriz de Rentabilidad Proyectada por Volumen</span>
            </h4>
            <span className="text-[11px] text-stone-500">
              Incluye Costos Fijos ($ {formatCLP(fixedCostsMonthlyCLP)})
            </span>
          </div>

          <div className="overflow-x-auto border border-stone-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                  <th className="py-2.5 px-3">Unidades/Mes</th>
                  <th className="py-2.5 px-3">Venta Total (CLP)</th>
                  <th className="py-2.5 px-3">COGS + Flete</th>
                  <th className="py-2.5 px-3">Inversión Pauta</th>
                  <th className="py-2.5 px-3">Pasarelas</th>
                  <th className="py-2.5 px-3 text-right">Resultado Neto Mensual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white">
                {financialResult.scenarios.map((sc, idx) => {
                  return (
                    <tr
                      key={idx}
                      className={
                        sc.status === 'equilibrio'
                          ? 'bg-amber-50/70 font-semibold'
                          : sc.status === 'ganancia'
                          ? 'hover:bg-stone-50'
                          : 'bg-rose-50/40 text-stone-700'
                      }
                    >
                      <td className="py-2.5 px-3 font-mono font-bold">
                        {sc.units} uds.
                        {sc.status === 'equilibrio' && (
                          <span className="ml-1.5 text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">
                            Break-even
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{formatCLP(sc.revenueCLP)}</td>
                      <td className="py-2.5 px-3 font-mono text-stone-600">{formatCLP(sc.cogsAndShippingCLP)}</td>
                      <td className="py-2.5 px-3 font-mono text-stone-600">{formatCLP(sc.adSpendCLP)}</td>
                      <td className="py-2.5 px-3 font-mono text-stone-600">{formatCLP(sc.gatewayFeesCLP)}</td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                        sc.netProfitCLP > 0
                          ? 'text-emerald-700'
                          : sc.netProfitCLP === 0
                          ? 'text-amber-800'
                          : 'text-rose-700'
                      }`}>
                        {formatCLP(sc.netProfitCLP)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
