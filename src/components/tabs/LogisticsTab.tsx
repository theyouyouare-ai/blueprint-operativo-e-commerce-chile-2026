import React, { useState, useMemo } from 'react';
import {
  Truck,
  Box,
  Code2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Building2,
  PackageCheck,
  Zap,
  Copy,
  Check,
  HelpCircle,
  Clock,
  ShieldCheck,
  MapPin,
  Scale,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  FileCode
} from 'lucide-react';
import {
  CHILE_COMUNAS,
  CHILE_COURIERS,
  ParcelDimensions,
  calculateVolumetricWeight,
  compareCouriersForDestination,
  calculateFulfillmentComparison,
  FulfillmentParams,
  getShipmentEventSequence,
  WebhookState,
  SAMPLE_ROUTE_HANDLER_CODE,
  ComunaInfo
} from '../../lib/logistics-engine';
import { COURIER_API_TEMPLATES, LOGISTICS_SEQUENCE_STEPS } from '../../data/logisticsPayloads';
import { formatCLP } from '../../utils/calculator';

interface LogisticsTabProps {
  exchangeRate?: number;
}

export const LogisticsTab: React.FC<LogisticsTabProps> = ({ exchangeRate = 960 }) => {
  // Navigation internal tabs
  const [activeSubTab, setActiveSubTab] = useState<'couriers' | 'fulfillment' | 'api_webhooks' | 'strategies'>('couriers');

  // --- Sub-Tab A: Courier Matrix State ---
  const [selectedComunaName, setSelectedComunaName] = useState<string>('Santiago Centro');
  const [dimensions, setDimensions] = useState<ParcelDimensions>({
    lengthCm: 22,
    widthCm: 16,
    heightCm: 12,
    weightKg: 0.85
  });
  const [filterPreference, setFilterPreference] = useState<'all' | 'pudo' | 'cod' | 'home'>('all');
  const [presetPackage, setPresetPackage] = useState<'custom' | 'gadget' | 'clothing' | 'home_heavy'>('gadget');

  // Helper for Presets
  const applyPreset = (type: 'gadget' | 'clothing' | 'home_heavy') => {
    setPresetPackage(type);
    if (type === 'gadget') {
      setDimensions({ lengthCm: 20, widthCm: 15, heightCm: 8, weightKg: 0.65 });
    } else if (type === 'clothing') {
      setDimensions({ lengthCm: 32, widthCm: 25, heightCm: 5, weightKg: 0.45 });
    } else if (type === 'home_heavy') {
      setDimensions({ lengthCm: 45, widthCm: 35, heightCm: 28, weightKg: 4.8 });
    }
  };

  const selectedComuna: ComunaInfo = useMemo(() => {
    return CHILE_COMUNAS.find((c) => c.name === selectedComunaName) || CHILE_COMUNAS[0];
  }, [selectedComunaName]);

  const volumetricStats = useMemo(() => {
    return calculateVolumetricWeight(dimensions);
  }, [dimensions]);

  const courierComparison = useMemo(() => {
    const raw = compareCouriersForDestination(dimensions, selectedComuna);
    if (filterPreference === 'pudo') {
      return raw.filter((c) => c.courier.supportsPudoPickUpPoints);
    }
    if (filterPreference === 'cod') {
      return raw.filter((c) => c.courier.supportsCOD);
    }
    return raw;
  }, [dimensions, selectedComuna, filterPreference]);

  // --- Sub-Tab B: Fulfillment Unit Economics State ---
  const [fulfillmentParams, setFulfillmentParams] = useState<FulfillmentParams>({
    monthlyOrders: 650,
    productSalePriceCLP: 34990,
    boxCostCLP: 480,
    tapeAndFillCostCLP: 220,
    labelThermalCostCLP: 50,
    warehouseMonthlyRentCLP: 380000,
    warehouseUtilityBillsCLP: 65000,
    warehouseStaffMonthlyCLP: 550000,
    inHouseFreightAvgCLP: 3290,
    tplStorageMonthlyPalletCLP: 29000,
    tplPalletsNeeded: 2,
    tplPickAndPackFeePerOrderCLP: 990,
    tplDiscountedFreightAvgCLP: 2890
  });

  const fulfillmentResults = useMemo(() => {
    return calculateFulfillmentComparison(fulfillmentParams);
  }, [fulfillmentParams]);

  // --- Sub-Tab C: Webhooks & APIs State ---
  const [selectedSequenceState, setSelectedSequenceState] = useState<WebhookState>('ORDER_CREATED');
  const [selectedApiTemplateId, setSelectedApiTemplateId] = useState<string>('blue-express-create');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);

  const eventSequence = useMemo(() => getShipmentEventSequence('CL-2026-8812'), []);
  const activeEvent = useMemo(() => {
    return eventSequence.find((e) => e.state === selectedSequenceState) || eventSequence[0];
  }, [eventSequence, selectedSequenceState]);

  const activeApiTemplate = useMemo(() => {
    return (
      COURIER_API_TEMPLATES.find((t) => t.id === selectedApiTemplateId) ||
      COURIER_API_TEMPLATES[0]
    );
  }, [selectedApiTemplateId]);

  const handleCopyText = (text: string, isPayload: boolean = false) => {
    navigator.clipboard.writeText(text);
    if (isPayload) {
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-sm relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-sky-50 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold uppercase tracking-wider mb-2">
              <Truck className="w-3.5 h-3.5" />
              Tab 5 · Logística, Fulfillment & APIs Chile 2026
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Arquitectura Logística & Fulfillment E-commerce
            </h2>
            <p className="text-stone-600 text-sm sm:text-base mt-1 max-w-3xl">
              Compara tarifas y SLAs reales de los 4 couriers líderes en Chile (Starken, Blue Express, Chilexpress y Chazki),
              audita el Unit Economics de armar en bodega propia vs. operar con un 3PL, e integra webhooks con validación Zod.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-4 py-3 rounded-xl">
            <Scale className="w-5 h-5 text-stone-500" />
            <div className="text-xs">
              <span className="text-stone-500 block">Factor Volumétrico Courier CL</span>
              <span className="font-bold text-stone-900">(L x W x H) / 4.000 cm³/kg</span>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Pills */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-stone-100">
          <button
            onClick={() => setActiveSubTab('couriers')}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
              activeSubTab === 'couriers'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            1. Matriz de Couriers & Tarifas
          </button>
          <button
            onClick={() => setActiveSubTab('fulfillment')}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
              activeSubTab === 'fulfillment'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            2. Unit Economics 3PL vs. Propio
          </button>
          <button
            onClick={() => setActiveSubTab('api_webhooks')}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
              activeSubTab === 'api_webhooks'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            3. Diseñador de APIs & Webhooks
          </button>
          <button
            onClick={() => setActiveSubTab('strategies')}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
              activeSubTab === 'strategies'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
            }`}
          >
            <Zap className="w-4 h-4" />
            4. Estrategias & SERNAC 6 Meses
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SUB-TAB: MATRIZ DE COURIERS & TARIFAS */}
      {/* ========================================================================= */}
      {activeSubTab === 'couriers' && (
        <div className="space-y-6">
          {/* Controls Bar: Comuna + Dimensions */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-sky-600" />
                  Simulador de Envíos en Tiempo Real
                </h3>
                <p className="text-sm text-stone-500">
                  Selecciona la comuna de destino y las dimensiones del paquete para calcular pesos facturables y tarifas.
                </p>
              </div>

              {/* Package Presets */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Presets:</span>
                <button
                  onClick={() => applyPreset('gadget')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    presetPackage === 'gadget'
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  📱 Gadget / Pet (0.65 kg)
                </button>
                <button
                  onClick={() => applyPreset('clothing')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    presetPackage === 'clothing'
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  👕 Ropa / Polerón (0.45 kg)
                </button>
                <button
                  onClick={() => applyPreset('home_heavy')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    presetPackage === 'home_heavy'
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  🏠 Hogar / Voluminoso (4.8 kg)
                </button>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Comuna Selector */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Comuna & Región de Destino
                </label>
                <select
                  value={selectedComunaName}
                  onChange={(e) => setSelectedComunaName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-stone-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {CHILE_COMUNAS.map((com) => (
                    <option key={com.name} value={com.name}>
                      {com.name} — Región {com.region}
                    </option>
                  ))}
                </select>
                <div className="mt-1.5 text-xs text-stone-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                  Zona de tarificación: <span className="font-semibold text-stone-700 capitalize">{selectedComuna.zone.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Largo, Ancho, Alto */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Largo x Ancho x Alto (cm)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={dimensions.lengthCm}
                    onChange={(e) => {
                      setPresetPackage('custom');
                      setDimensions({ ...dimensions, lengthCm: Number(e.target.value) || 1 });
                    }}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-2 text-xs font-medium text-center focus:ring-2 focus:ring-sky-500"
                    placeholder="L"
                  />
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={dimensions.widthCm}
                    onChange={(e) => {
                      setPresetPackage('custom');
                      setDimensions({ ...dimensions, widthCm: Number(e.target.value) || 1 });
                    }}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-2 text-xs font-medium text-center focus:ring-2 focus:ring-sky-500"
                    placeholder="W"
                  />
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={dimensions.heightCm}
                    onChange={(e) => {
                      setPresetPackage('custom');
                      setDimensions({ ...dimensions, heightCm: Number(e.target.value) || 1 });
                    }}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-2 text-xs font-medium text-center focus:ring-2 focus:ring-sky-500"
                    placeholder="H"
                  />
                </div>
                <span className="text-[11px] text-stone-400 block mt-1">
                  Volumen: {(dimensions.lengthCm * dimensions.widthCm * dimensions.heightCm).toLocaleString('es-CL')} cm³
                </span>
              </div>

              {/* Peso Físico */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Peso Físico Real (kg)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="100"
                  value={dimensions.weightKg}
                  onChange={(e) => {
                    setPresetPackage('custom');
                    setDimensions({ ...dimensions, weightKg: Number(e.target.value) || 0.1 });
                  }}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-stone-900 focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-[11px] text-stone-400 block mt-1">Báscula o balanza digital</span>
              </div>

              {/* Resultado Peso Facturable */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex flex-col justify-between">
                <div className="text-xs text-stone-500">Peso Facturable Courier:</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-stone-900">
                    {volumetricStats.billableWeightKg} kg
                  </span>
                  <span className="text-[11px] text-stone-500">
                    (Vol: {volumetricStats.volumetricWeightKg} kg)
                  </span>
                </div>
                <div className="text-[10px] text-stone-500">
                  {volumetricStats.volumetricWeightKg > dimensions.weightKg ? (
                    <span className="text-amber-700 font-semibold">⚠️ Cobra por volumen (&gt; peso real)</span>
                  ) : (
                    <span className="text-emerald-700 font-semibold">✅ Cobra por peso físico real</span>
                  )}
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs font-medium text-stone-500">Filtrar por:</span>
              <button
                onClick={() => setFilterPreference('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterPreference === 'all'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Todos los Couriers
              </button>
              <button
                onClick={() => setFilterPreference('pudo')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterPreference === 'pudo'
                    ? 'bg-sky-700 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                📦 Con Puntos / Lockers PUDO (-18% tarifa)
              </button>
              <button
                onClick={() => setFilterPreference('cod')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterPreference === 'cod'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                💵 Pago Contra Entrega (COD)
              </button>
            </div>
          </div>

          {/* Couriers Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {courierComparison.map((item) => {
              const { courier, isAvailableInZone, finalHomeRateCLP, finalPickupRateCLP, sla, isCheapest, isFastest } = item;

              return (
                <div
                  key={courier.id}
                  className={`rounded-2xl border p-5 transition-all flex flex-col justify-between relative bg-white ${
                    !isAvailableInZone
                      ? 'border-stone-200 opacity-60 bg-stone-50'
                      : isCheapest
                      ? 'border-emerald-400 ring-2 ring-emerald-500/20 shadow-md'
                      : isFastest
                      ? 'border-amber-400 ring-2 ring-amber-500/20 shadow-md'
                      : 'border-stone-200 hover:border-stone-300 shadow-sm'
                  }`}
                >
                  {/* Badges */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                    {isCheapest && isAvailableInZone && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> MÁS ECONÓMICO
                      </span>
                    )}
                    {isFastest && isAvailableInZone && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> MÁS RÁPIDO
                      </span>
                    )}
                  </div>

                  <div>
                    {/* Courier Name & Tagline */}
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-8 rounded-full"
                        style={{ backgroundColor: courier.logoColor }}
                      />
                      <div>
                        <h4 className="font-bold text-stone-900 text-base leading-tight">
                          {courier.name}
                        </h4>
                        <span className="text-[11px] text-stone-500 block leading-tight">
                          {courier.tagline}
                        </span>
                      </div>
                    </div>

                    {/* Pricing */}
                    {isAvailableInZone ? (
                      <div className="mt-4 pt-3 border-t border-stone-100">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-stone-500">Entrega a Domicilio:</span>
                          <span className="text-xl font-black text-stone-900">
                            {formatCLP(finalHomeRateCLP)}
                          </span>
                        </div>

                        {courier.supportsPudoPickUpPoints && (
                          <div className="flex items-baseline justify-between mt-1 text-xs">
                            <span className="text-sky-700 font-medium">Retiro en Locker/Agencia:</span>
                            <span className="font-bold text-sky-800">
                              {formatCLP(finalPickupRateCLP)}
                            </span>
                          </div>
                        )}

                        <div className="mt-2 text-xs flex items-center gap-1.5 text-stone-600 bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200/60">
                          <Clock className="w-3.5 h-3.5 text-stone-500" />
                          <span>SLA Tránsito: <strong>{sla}</strong></span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 py-4 px-3 bg-stone-100 rounded-xl text-center text-xs text-stone-500">
                        ⚠️ Sin cobertura en la comuna de {selectedComuna.name}
                      </div>
                    )}

                    {/* Features List */}
                    <div className="mt-4 space-y-1.5 text-xs text-stone-600">
                      <div className="flex items-center gap-2">
                        {courier.supportsCOD ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            ✓ COD Disponible
                          </span>
                        ) : (
                          <span className="text-stone-400">✗ Sin cobro contra entrega</span>
                        )}
                        <span className="text-stone-300">|</span>
                        {courier.supportsSameDayRM ? (
                          <span className="text-emerald-600 font-semibold">✓ Same-Day RM</span>
                        ) : (
                          <span className="text-stone-400">✗ Same-Day</span>
                        )}
                      </div>

                      <p className="text-[11px] text-stone-500 pt-1 leading-snug">
                        {courier.coverageDescription}
                      </p>
                    </div>
                  </div>

                  {/* Recommendation footer */}
                  <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-700 bg-stone-50/70 -mx-5 -mb-5 p-3 rounded-b-2xl">
                    <span className="font-semibold text-stone-900 block">Recomendado para:</span>
                    {courier.recommendedFor}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deep Comparison Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
              <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-stone-600" />
                Matriz Comparativa de Capacidades Operativas 2026
              </h4>
              <span className="text-xs text-stone-500">Valores referenciales con IVA para cuenta empresa</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-stone-700">
                <thead className="bg-stone-50 text-stone-600 uppercase font-semibold border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3">Courier</th>
                    <th className="px-4 py-3">Red de Retiro PUDO</th>
                    <th className="px-4 py-3">Condiciones COD (Contra Entrega)</th>
                    <th className="px-4 py-3">Integración API / Plugin</th>
                    <th className="px-4 py-3">Cumplimiento SLA Nacional</th>
                    <th className="px-4 py-3">Mejor Caso de Uso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <tr className="hover:bg-stone-50/80">
                    <td className="px-4 py-3.5 font-bold text-stone-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Starken
                    </td>
                    <td className="px-4 py-3">
                      400+ Sucursales. Tarifa reducida por retiro en agencia.
                    </td>
                    <td className="px-4 py-3">
                      2.5% sobre monto recaudado (Mín. $1.500 CLP). Liquidación semanal.
                    </td>
                    <td className="px-4 py-3">API REST, Envíame, Shipit, Plugin Shopify</td>
                    <td className="px-4 py-3 font-medium text-stone-900">92.5%</td>
                    <td className="px-4 py-3 text-stone-600">Bultos pesados, provincia profunda y retiro en sucursal</td>
                  </tr>
                  <tr className="hover:bg-stone-50/80">
                    <td className="px-4 py-3.5 font-bold text-stone-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-600" /> Blue Express
                    </td>
                    <td className="px-4 py-3">
                      2.000+ Puntos Blue y Lockers inteligentes 24/7 en estaciones de metro y minimarkets.
                    </td>
                    <td className="px-4 py-3">
                      2.8% sobre monto. Soporta recolección en efectivo y POS Transbank en ruta.
                    </td>
                    <td className="px-4 py-3">API v2 nativa, App Shopify, Envíame, Shipit</td>
                    <td className="px-4 py-3 font-medium text-stone-900">94.8%</td>
                    <td className="px-4 py-3 text-stone-600">E-commerce masivo de ticket medio y paquetería estándar</td>
                  </tr>
                  <tr className="hover:bg-stone-50/80">
                    <td className="px-4 py-3.5 font-bold text-stone-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Chilexpress
                    </td>
                    <td className="px-4 py-3">
                      Red extensa de sucursales con entrega matutina garantizada (Priority).
                    </td>
                    <td className="px-4 py-3">
                      3.0% sobre valor recaudado. Transferencia bancaria a cuenta corriente de SpA.
                    </td>
                    <td className="px-4 py-3">API Corporativa, Marketplace Connect, Envíame</td>
                    <td className="px-4 py-3 font-medium text-emerald-700">98.4% (Líder en puntualidad)</td>
                    <td className="px-4 py-3 text-stone-600">Productos premium, tecnología delicada, islas y zonas extremas</td>
                  </tr>
                  <tr className="hover:bg-stone-50/80">
                    <td className="px-4 py-3.5 font-bold text-stone-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Chazki / 99Minutos
                    </td>
                    <td className="px-4 py-3">
                      Exclusivo entrega a domicilio urbana (Sin casilleros).
                    </td>
                    <td className="px-4 py-3 text-stone-400">
                      No disponible (Solo pedidos pagados con pasarela online).
                    </td>
                    <td className="px-4 py-3">API Webhook, Shipit, Melonn, Shopify App</td>
                    <td className="px-4 py-3 font-medium text-stone-900">95.2% en ventana Same-Day</td>
                    <td className="px-4 py-3 text-stone-600">Ventas en Gran Santiago con promesa de entrega en pocas horas</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-TAB: UNIT ECONOMICS 3PL VS PROPIO */}
      {/* ========================================================================= */}
      {activeSubTab === 'fulfillment' && (
        <div className="space-y-6">
          {/* Winner Banner */}
          <div
            className={`p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              fulfillmentResults.winner === 'tpl'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-3 rounded-xl ${
                  fulfillmentResults.winner === 'tpl'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-600 text-white'
                }`}
              >
                {fulfillmentResults.winner === 'tpl' ? (
                  <Building2 className="w-6 h-6" />
                ) : (
                  <Box className="w-6 h-6" />
                )}
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block opacity-75">
                  Recomendación Estratégica
                </span>
                <h3 className="text-xl font-bold">
                  {fulfillmentResults.winner === 'tpl'
                    ? 'El modelo 3PL (Fulfillment Tercerizado) es más rentable'
                    : 'La Operación Propia (In-House) es más rentable actualmente'}
                </h3>
                <p className="text-sm mt-1 max-w-2xl opacity-90">
                  {fulfillmentResults.recommendation}
                </p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm px-5 py-3 rounded-xl border border-black/5 text-right shrink-0">
              <span className="text-xs text-stone-500 block">Diferencia Mensual Estimada:</span>
              <span className="text-2xl font-black text-stone-900">
                {formatCLP(fulfillmentResults.monthlySavingsCLP)}
              </span>
              <span className="text-[11px] text-stone-500 block">
                {formatCLP(Math.abs(fulfillmentResults.differencePerOrderCLP))} por pedido
              </span>
            </div>
          </div>

          {/* Sliders & Parameters Input Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Parámetros Generales */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2 border-b border-stone-100 pb-2">
                <Box className="w-4 h-4 text-stone-600" />
                1. Volumen & Empaque
              </h4>

              <div>
                <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                  <span>Envíos Mensuales:</span>
                  <span className="text-sky-700 font-bold">{fulfillmentParams.monthlyOrders} pedidos</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="3000"
                  step="25"
                  value={fulfillmentParams.monthlyOrders}
                  onChange={(e) =>
                    setFulfillmentParams({
                      ...fulfillmentParams,
                      monthlyOrders: Number(e.target.value)
                    })
                  }
                  className="w-full accent-stone-900"
                />
                <div className="flex justify-between text-[10px] text-stone-400">
                  <span>50 pedidos</span>
                  <span>1.500 pedidos</span>
                  <span>3.000 pedidos</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  PVP Promedio del Producto:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">$</span>
                  <input
                    type="number"
                    step="500"
                    value={fulfillmentParams.productSalePriceCLP}
                    onChange={(e) =>
                      setFulfillmentParams({
                        ...fulfillmentParams,
                        productSalePriceCLP: Number(e.target.value) || 1000
                      })
                    }
                    className="w-full pl-7 pr-3 py-2 text-xs font-semibold bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Insumos unitarios */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <span className="text-xs font-semibold text-stone-700 block">
                  Insumos Unitarios de Empaque (CLP):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-stone-500 block">Caja Kraft</span>
                    <input
                      type="number"
                      value={fulfillmentParams.boxCostCLP}
                      onChange={(e) =>
                        setFulfillmentParams({
                          ...fulfillmentParams,
                          boxCostCLP: Number(e.target.value) || 0
                        })
                      }
                      className="w-full px-2 py-1.5 text-xs bg-stone-50 border rounded text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 block">Cinta/Relleno</span>
                    <input
                      type="number"
                      value={fulfillmentParams.tapeAndFillCostCLP}
                      onChange={(e) =>
                        setFulfillmentParams({
                          ...fulfillmentParams,
                          tapeAndFillCostCLP: Number(e.target.value) || 0
                        })
                      }
                      className="w-full px-2 py-1.5 text-xs bg-stone-50 border rounded text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 block">Etiqueta Tér.</span>
                    <input
                      type="number"
                      value={fulfillmentParams.labelThermalCostCLP}
                      onChange={(e) =>
                        setFulfillmentParams({
                          ...fulfillmentParams,
                          labelThermalCostCLP: Number(e.target.value) || 0
                        })
                      }
                      className="w-full px-2 py-1.5 text-xs bg-stone-50 border rounded text-center"
                    />
                  </div>
                </div>
                <span className="text-[11px] text-stone-500 block text-right">
                  Total Empaque: <strong>{formatCLP(fulfillmentParams.boxCostCLP + fulfillmentParams.tapeAndFillCostCLP + fulfillmentParams.labelThermalCostCLP)}</strong>
                </span>
              </div>
            </div>

            {/* Column 2: Operación Propia */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
              <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2 border-b border-stone-100 pb-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                2. Costos In-House (Propio)
              </h4>

              <div>
                <label className="block text-[11px] text-stone-600 mb-1">
                  Arriendo Bodega / Taller (Mensual):
                </label>
                <input
                  type="number"
                  step="10000"
                  value={fulfillmentParams.warehouseMonthlyRentCLP}
                  onChange={(e) =>
                    setFulfillmentParams({
                      ...fulfillmentParams,
                      warehouseMonthlyRentCLP: Number(e.target.value) || 0
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] text-stone-600 mb-1">
                  Cuentas & Gastos Comunes:
                </label>
                <input
                  type="number"
                  step="5000"
                  value={fulfillmentParams.warehouseUtilityBillsCLP}
                  onChange={(e) =>
                    setFulfillmentParams({
                      ...fulfillmentParams,
                      warehouseUtilityBillsCLP: Number(e.target.value) || 0
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] text-stone-600 mb-1">
                  Mano de Obra / Sueldo Armador:
                </label>
                <input
                  type="number"
                  step="20000"
                  value={fulfillmentParams.warehouseStaffMonthlyCLP}
                  onChange={(e) =>
                    setFulfillmentParams({
                      ...fulfillmentParams,
                      warehouseStaffMonthlyCLP: Number(e.target.value) || 0
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] text-stone-600 mb-1">
                  Flete Courier Promedio Propio:
                </label>
                <input
                  type="number"
                  step="50"
                  value={fulfillmentParams.inHouseFreightAvgCLP}
                  onChange={(e) =>
                    setFulfillmentParams({
                      ...fulfillmentParams,
                      inHouseFreightAvgCLP: Number(e.target.value) || 0
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>
            </div>

            {/* Column 3: 3PL Fulfillment */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
              <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2 border-b border-stone-100 pb-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                3. Costos Centro 3PL
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-stone-600 mb-1">
                    Costo Pallet / Mes:
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={fulfillmentParams.tplStorageMonthlyPalletCLP}
                    onChange={(e) =>
                      setFulfillmentParams({
                        ...fulfillmentParams,
                        tplStorageMonthlyPalletCLP: Number(e.target.value) || 0
                      })
                    }
                    className="w-full px-2 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-stone-600 mb-1">
                    N° Pallets Stock:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={fulfillmentParams.tplPalletsNeeded}
                    onChange={(e) =>
                      setFulfillmentParams({
                        ...fulfillmentParams,
                        tplPalletsNeeded: Number(e.target.value) || 1
                      })
                    }
                    className="w-full px-2 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-stone-600 mb-1">
                  Tarifa Pick & Pack por Pedido:
                </label>
                <input
                  type="number"
                  step="50"
                  value={fulfillmentParams.tplPickAndPackFeePerOrderCLP}
                  onChange={(e) =>
                    setFulfillmentParams({
                      ...fulfillmentParams,
                      tplPickAndPackFeePerOrderCLP: Number(e.target.value) || 0
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] text-stone-600 mb-1">
                  Flete Courier Descontado 3PL:
                </label>
                <input
                  type="number"
                  step="50"
                  value={fulfillmentParams.tplDiscountedFreightAvgCLP}
                  onChange={(e) =>
                    setFulfillmentParams({
                      ...fulfillmentParams,
                      tplDiscountedFreightAvgCLP: Number(e.target.value) || 0
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg"
                />
                <span className="text-[10px] text-stone-400 block mt-0.5">
                  *Los 3PL negocian tarifas por volumen un 10-15% más baratas
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Side-by-Side Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* In-House Card */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <span className="font-bold text-stone-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Operación In-House (Propia)
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                  {fulfillmentResults.inHouse.costPctOfSalePrice}% del PVP
                </span>
              </div>

              <div className="my-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-stone-500">Costo Total por Pedido:</span>
                  <span className="text-3xl font-black text-stone-900">
                    {formatCLP(fulfillmentResults.inHouse.totalCostPerOrderCLP)}
                  </span>
                </div>
                <span className="text-xs text-stone-400 block text-right">
                  Total mensual: {formatCLP(fulfillmentResults.inHouse.totalMonthlyCostCLP)}
                </span>
              </div>

              <div className="space-y-2 text-xs border-t border-stone-100 pt-3">
                <div className="flex justify-between text-stone-600">
                  <span>Insumos de empaque:</span>
                  <span className="font-medium">{formatCLP(fulfillmentResults.inHouse.packagingTotalPerOrderCLP)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Arriendo y gastos fijos prorrateados:</span>
                  <span className="font-medium">{formatCLP(fulfillmentResults.inHouse.fixedOverheadPerOrderCLP)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Mano de obra (Pick & Pack propio):</span>
                  <span className="font-medium">{formatCLP(fulfillmentResults.inHouse.laborPerOrderCLP)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Flete courier directo:</span>
                  <span className="font-medium">{formatCLP(fulfillmentResults.inHouse.freightPerOrderCLP)}</span>
                </div>
              </div>
            </div>

            {/* 3PL Card */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <span className="font-bold text-stone-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Centro 3PL (Fulfillment Externo)
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                  {fulfillmentResults.tpl.costPctOfSalePrice}% del PVP
                </span>
              </div>

              <div className="my-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-stone-500">Costo Total por Pedido:</span>
                  <span className="text-3xl font-black text-stone-900">
                    {formatCLP(fulfillmentResults.tpl.totalCostPerOrderCLP)}
                  </span>
                </div>
                <span className="text-xs text-stone-400 block text-right">
                  Total mensual: {formatCLP(fulfillmentResults.tpl.totalMonthlyCostCLP)}
                </span>
              </div>

              <div className="space-y-2 text-xs border-t border-stone-100 pt-3">
                <div className="flex justify-between text-stone-600">
                  <span>Insumos de empaque:</span>
                  <span className="font-medium">{formatCLP(fulfillmentResults.tpl.packagingTotalPerOrderCLP)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Almacenaje por pallet prorrateado:</span>
                  <span className="font-medium">{formatCLP(fulfillmentResults.tpl.storagePerOrderCLP)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Tarifa Pick & Pack del 3PL:</span>
                  <span className="font-medium">{formatCLP(fulfillmentResults.tpl.pickAndPackFeeCLP)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Flete courier descontado por volumen:</span>
                  <span className="font-medium">{formatCLP(fulfillmentResults.tpl.freightPerOrderCLP)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-TAB: DISEÑADOR DE ARQUITECTURA API & WEBHOOKS */}
      {/* ========================================================================= */}
      {activeSubTab === 'api_webhooks' && (
        <div className="space-y-6">
          {/* Visual Sequence Diagram */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-sky-600" />
                Ciclo de Vida de Estados de Envío (Chile 2026)
              </h3>
              <p className="text-sm text-stone-500">
                Flujo de eventos automáticos desde que el cliente paga en el checkout hasta la confirmación de entrega o reintento de morador ausente.
              </p>
            </div>

            {/* Steps Progress Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {eventSequence.map((step) => {
                const isActive = step.state === selectedSequenceState;
                return (
                  <button
                    key={step.state}
                    onClick={() => setSelectedSequenceState(step.state)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'border-stone-900 bg-stone-900 text-white shadow-sm ring-2 ring-stone-900/10'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <span className={`text-[10px] font-bold block mb-1 uppercase tracking-wider ${
                      isActive ? 'text-sky-300' : 'text-stone-400'
                    }`}>
                      Paso {step.stepNumber}
                    </span>
                    <span className="font-bold text-xs leading-snug block">
                      {step.state.replace('_', ' ')}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Step Details & Payload View */}
            <div className="bg-stone-900 text-stone-100 p-5 rounded-2xl border border-stone-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
                <div>
                  <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                    Evento Activo
                  </span>
                  <h4 className="text-base font-bold text-white mt-0.5">
                    {activeEvent.title}
                  </h4>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {activeEvent.description}
                  </p>
                </div>

                <button
                  onClick={() => handleCopyText(JSON.stringify(activeEvent.payload, null, 2), true)}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  {copiedPayload ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copiar Payload JSON
                    </>
                  )}
                </button>
              </div>

              {/* Code Pre */}
              <div className="bg-black/60 rounded-xl p-4 overflow-x-auto text-xs font-mono text-emerald-400 max-h-72 border border-stone-800">
                <pre>{JSON.stringify(activeEvent.payload, null, 2)}</pre>
              </div>

              <div className="text-xs text-stone-400 bg-stone-800/60 px-3.5 py-2.5 rounded-xl border border-stone-700/60 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Acción Gatillada por el Sistema: </strong>
                  {activeEvent.nextStepAction}
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Module: Courier API Templates & Next.js Route Handler */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Courier API Templates */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-sky-600" />
                    Templates de Integración API Courier
                  </h4>
                  <span className="text-xs text-stone-500">
                    Endpoints y cuerpos de petición para emitir envíos directamente
                  </span>
                </div>
              </div>

              {/* Courier Selector Pills */}
              <div className="grid grid-cols-2 gap-1.5">
                {COURIER_API_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedApiTemplateId(tmpl.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium text-left border transition-all ${
                      tmpl.id === selectedApiTemplateId
                        ? 'border-sky-500 bg-sky-50 text-sky-900 font-bold'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    {tmpl.name.split(' - ')[0]}
                  </button>
                ))}
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-stone-900 text-white font-mono text-[10px] font-bold">
                    {activeApiTemplate.method}
                  </span>
                  <span className="font-mono text-[11px] text-stone-700 truncate">
                    {activeApiTemplate.endpoint}
                  </span>
                </div>
                <p className="text-stone-600 text-[11px]">{activeApiTemplate.description}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-stone-700 block">Payload JSON de Petición:</span>
                <div className="bg-stone-900 text-stone-100 p-3.5 rounded-xl font-mono text-[11px] max-h-56 overflow-y-auto">
                  <pre>{activeApiTemplate.jsonPayload}</pre>
                </div>
              </div>
            </div>

            {/* Next.js Route Handler Implementation with Zod */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-emerald-600" />
                      Route Handler Next.js (App Router)
                    </h4>
                    <span className="text-xs text-stone-500">
                      <code>app/api/webhooks/courier/route.ts</code> con validación estricta Zod
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyText(SAMPLE_ROUTE_HANDLER_CODE, false)}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium border border-stone-200 flex items-center gap-1"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode ? 'Copiado' : 'Copiar TS'}
                  </button>
                </div>

                <div className="bg-stone-900 text-stone-100 p-4 rounded-xl font-mono text-[11px] max-h-80 overflow-y-auto mt-4">
                  <pre>{SAMPLE_ROUTE_HANDLER_CODE}</pre>
                </div>
              </div>

              <div className="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1">
                <span className="font-bold text-stone-900 block">🛡️ Mejores Prácticas de Producción:</span>
                <ul className="list-disc list-inside space-y-0.5 text-stone-600 text-[11px]">
                  <li>Validar la firma HMAC enviada en el header <code>x-courier-signature</code>.</li>
                  <li>Implementar idempotencia para evitar procesar dos veces el mismo evento de entrega.</li>
                  <li>Disparar notificación por WhatsApp Business API al comprador al cambiar a <code>out_for_delivery</code>.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-TAB: ESTRATEGIAS LOGÍSTICAS & SERNAC 6 MESES */}
      {/* ========================================================================= */}
      {activeSubTab === 'strategies' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Estrategia 1: Envío Gratis vs Tarifa Fija */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                1
              </div>
              <h4 className="font-bold text-stone-900 text-base">
                Envío Gratis con Umbral ($29.990)
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                En Chile, cobrar flete real ($3.800 a $4.500) en el checkout provoca una tasa de abandono de carrito de más del 55%.
              </p>
              <div className="bg-sky-50 p-3 rounded-xl border border-sky-100 text-xs text-sky-900 space-y-1">
                <strong>Regla de Oro:</strong> Establece "Envío Gratis a todo Chile por compras sobre $29.990". Subsidia el costo del flete ($2.990) dentro del margen bruto mediante cross-sells y packs dobles.
              </div>
            </div>

            {/* Estrategia 2: Mitigación Morador Ausente */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                2
              </div>
              <h4 className="font-bold text-stone-900 text-base">
                Lockers PUDO: Cero Fallas de Entrega
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                La primera causa de queja en SERNAC por e-commerce es "Repartidor visitó y no había nadie". Esto duplica los costos de reintento.
              </p>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-xs text-emerald-900 space-y-1">
                <strong>Solución PUDO:</strong> Ofrece un 10% de descuento o despacho más barato al seleccionar retiro en casillero inteligente o Punto Blue. El cliente retira 24/7 sin esperar en casa.
              </div>
            </div>

            {/* Estrategia 3: Logística Inversa SERNAC */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                3
              </div>
              <h4 className="font-bold text-stone-900 text-base">
                Logística Inversa (Garantía 6 Meses)
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                La Ley N° 19.496 del Consumidor exige 6 meses de garantía legal. El costo de retorno por producto defectuoso debe ser asumido por la tienda.
              </p>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-xs text-amber-900 space-y-1">
                <strong>Protocolo de Retorno:</strong> Genera una etiqueta de retorno prepagada con Blue Express o Starken para que el cliente deposite el paquete sin pagar nada en la sucursal más cercana.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
