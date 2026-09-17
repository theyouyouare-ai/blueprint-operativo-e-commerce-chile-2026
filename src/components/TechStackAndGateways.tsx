import React, { useState } from 'react';
import { PAYMENT_GATEWAYS } from '../data/blueprintData';
import { 
  Layers, 
  CreditCard, 
  Server, 
  Truck, 
  FileText, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Zap,
  Clock
} from 'lucide-react';

export const TechStackAndGateways: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<'shopify' | 'woocommerce'>('shopify');
  const [activeGatewayId, setActiveGatewayId] = useState<string>('webpay_plus');
  const [monthlyVolumeCLP, setMonthlyVolumeCLP] = useState<number>(5000000); // 5M CLP default monthly sales

  // Platform comparison fee math
  // Shopify: USD 34 (~32.000 CLP) + 1% external gateway fee on 5M = 50.000 CLP. Total: 82.000 CLP
  // WooCommerce: Hosting ~10.000 CLP/mo + 0% platform fee. Total: ~10.000 CLP + dev overhead.
  const shopifyPlatformFee = Math.round(monthlyVolumeCLP * 0.01) + 32000;
  const wooPlatformFee = 10000;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-stone-900 text-white rounded-xl">
            <Layers className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-stone-900">
              FASE 2 — Stack Tecnológico, Proveedores y Pasarelas
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Arquitectura de software para Chile: Shopify vs WooCommerce, evolución de proveedores y redundancia de pasarelas locales.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Shopify vs WooCommerce */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              1. Selección de Plataforma: Shopify Basic vs WooCommerce
            </h3>
            <p className="text-xs text-stone-500">
              Evaluación económica y operativa sin Shopify Payments en Chile
            </p>
          </div>
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedPlatform('shopify')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                selectedPlatform === 'shopify'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Shopify Basic (Recomendado Fase 1-2)
            </button>
            <button
              onClick={() => setSelectedPlatform('woocommerce')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                selectedPlatform === 'woocommerce'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              WooCommerce (Escalamiento)
            </button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Criterio Operativo</th>
                <th className="py-3 px-4 text-stone-900 font-bold">Shopify Basic (Fase 1-2)</th>
                <th className="py-3 px-4 text-stone-900 font-bold">WooCommerce (Fase Escala)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              <tr>
                <td className="py-3 px-4 font-semibold text-stone-900">Costo mensual recurrente</td>
                <td className="py-3 px-4">
                  ~USD 29-39 (~CLP 27.000-37.000) + <strong>comisión externa 0,5%-2%</strong> por venta (por no operar Shopify Payments)
                </td>
                <td className="py-3 px-4">
                  Software libre gratis + Hosting (CLP 80.000-150.000/año) + plugins/tema (~CLP 10.000/mes)
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-stone-900">Velocidad de lanzamiento</td>
                <td className="py-3 px-4 text-emerald-700 font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> 1 a 2 días (listo para correr ads)
                </td>
                <td className="py-3 px-4 text-amber-700">
                  1 a 2 semanas (configuración servidor, certificados, plugins)
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-stone-900">Pasarela local en Chile</td>
                <td className="py-3 px-4">
                  Requiere app externa (Webpay Transbank, Mercado Pago, Flow)
                </td>
                <td className="py-3 px-4 text-emerald-700 font-semibold">
                  Integración directa con Transbank/Webpay vía plugin oficial, sin comisión de plataforma adicional
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-stone-900">Mantenimiento y DevOps</td>
                <td className="py-3 px-4 text-emerald-700 font-medium">
                  Bajo (hosting de alta disponibilidad, seguridad PCI-DSS y CDN incluidos)
                </td>
                <td className="py-3 px-4 text-stone-600">
                  Medio-alto (actualizaciones manuales de WordPress, backups, parches de seguridad)
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-stone-900">Facturación SII (DTEs)</td>
                <td className="py-3 px-4">
                  No nativa — requiere conector externo (Bsale, OpenFactura, Haulmer)
                </td>
                <td className="py-3 px-4">
                  No nativa — mismos conectores vía plugin oficial o webhook
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Verdict Box */}
        <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-950 leading-relaxed">
          <strong>Recomendación Ejecutiva:</strong> Parte en <strong>Shopify Basic</strong> para las Fases 1 y 2 por su máxima velocidad de salida al mercado y facilidad para probar los 10-15 SKUs iniciales de los 3 nichos sin distracciones técnicas. Cuando un SKU valide con tracción comprobada y superes los CLP $8M-$10M mensuales de facturación, evalúa migrar a WooCommerce para ahorrarte el 1% de comisión externa de Shopify. La migración de clientes y catálogo es un procedimiento estándar.
        </div>
      </div>

      {/* Section 2: Proveedores & Ciclo de Vida */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="border-b border-stone-100 pb-3">
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-stone-700" />
            <span>2. Estrategia de Proveedores & Automatización</span>
          </h3>
          <p className="text-xs text-stone-500">
            Fase de testeo inicial vs. Escalamiento de SKU ganador
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Mes 1-2 Testing */}
          <div className="bg-stone-50 rounded-xl p-5 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Mes 1 - 2 (Validación Ágil)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-200 text-stone-800">
                Catálogo Amplio
              </span>
            </div>
            <h4 className="text-base font-bold text-stone-900">
              DSers + AliExpress Directo
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Es el partner oficial de AliExpress, 100% gratuito, con el catálogo más extenso para probar rápidamente los 10-15 SKU de los 3 nichos sin comprometer capital en inventario.
            </p>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/80 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>Tiempo de despacho a Chile: 15 a 25 días</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Debes explicitar este plazo con total transparencia en la ficha del producto para neutralizar reclamos bajo la Ley del Consumidor en Chile.
              </p>
            </div>
          </div>

          {/* Escalamiento */}
          <div className="bg-stone-50 rounded-xl p-5 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Producto Validado (Escalamiento)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Alta Conversión
              </span>
            </div>
            <h4 className="text-base font-bold text-stone-900">
              CJdropshipping o Dropi LATAM (Contra Entrega)
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Una vez detectado el SKU ganador, migra el flujo a:
            </p>
            <ul className="text-xs text-stone-700 space-y-2">
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-stone-900">• CJdropshipping:</span> Si buscas construir marca con empaque personalizado (white label) y bodegas regionales.
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-emerald-700">• Dropi (Stock Local):</span> Entregas en 24-72 horas con opción de <strong>Pago Contra Entrega (Cash On Delivery)</strong>, lo cual puede triplicar la tasa de conversión en LATAM.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 3: Pasarelas de Pago & Redundancia */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="border-b border-stone-100 pb-3">
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-stone-700" />
            <span>3. Pasarelas de Pago en Chile (Sin Shopify Payments)</span>
          </h3>
          <p className="text-xs text-stone-500">
            Comparativa de comisiones, plazos de liquidación y arquitectura de contingencia
          </p>
        </div>

        {/* Gateways Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PAYMENT_GATEWAYS.map((gw) => {
            const isSelected = activeGatewayId === gw.id;
            return (
              <div
                key={gw.id}
                onClick={() => setActiveGatewayId(gw.id)}
                className={`cursor-pointer rounded-2xl p-5 border transition-all ${
                  isSelected
                    ? 'border-stone-900 bg-stone-50/70 shadow-sm ring-1 ring-stone-900'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-800">
                    {gw.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-stone-900">
                    Uptime {gw.reliabilityScore}%
                  </span>
                </div>
                <h4 className="text-base font-bold text-stone-900 mb-1">{gw.name}</h4>
                <div className="text-xs font-mono text-stone-600 bg-white p-2 rounded border border-stone-200 mb-3">
                  Comisión: <strong className="text-stone-900">{gw.commission}</strong>
                </div>
                <div className="text-xs text-stone-600 mb-3">
                  <span className="font-semibold text-stone-800">Liquidación:</span> {gw.settlementTime}
                </div>
                <p className="text-xs text-stone-600 leading-snug">
                  {gw.whenToUse}
                </p>
              </div>
            );
          })}
        </div>

        {/* Redundancy Architecture Diagram Box */}
        <div className="bg-stone-900 text-white rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Arquitectura de Respaldo Obligatoria (Checkout a Prueba de Caídas)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center text-xs">
            <div className="p-3.5 bg-stone-800 rounded-xl border border-stone-700 text-center">
              <div className="text-[10px] text-stone-400 font-bold uppercase">Pasarela Principal (75-85% del flujo)</div>
              <div className="text-base font-bold text-white mt-1">Webpay Plus</div>
              <div className="text-[11px] text-emerald-400 font-mono mt-0.5">1,75% Débito / 2,35% Crédito</div>
              <div className="text-[10px] text-stone-400 mt-1">Menor costo y confianza masiva Redcompra</div>
            </div>

            <div className="text-center font-bold text-amber-400 hidden sm:block">
              + Respaldo Automático ⇄
            </div>

            <div className="p-3.5 bg-stone-800 rounded-xl border border-stone-700 text-center">
              <div className="text-[10px] text-stone-400 font-bold uppercase">Pasarela Respaldo (15-25% del flujo)</div>
              <div className="text-base font-bold text-white mt-1">Mercado Pago</div>
              <div className="text-[11px] text-amber-300 font-mono mt-0.5">~3,09% + IVA</div>
              <div className="text-[10px] text-stone-400 mt-1">Activa cuotas sin interés y rescata compras si Transbank falla</div>
            </div>
          </div>

          <p className="text-xs text-stone-300 leading-relaxed">
            *Transbank presenta ventanas de mantenimiento o caídas temporales de autorización bancaria varias veces al año. Configurar Mercado Pago como segunda opción visible en el checkout evita el abandono instantáneo y rescata ventas que de otro modo se perderían.
          </p>
        </div>

        {/* Section 4: Facturación SII */}
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-stone-200 rounded-lg text-stone-700 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-stone-900 text-sm">Facturación Electrónica Automática SII (Obligatoria)</h5>
              <p className="text-stone-600 mt-0.5">
                Ni Shopify ni WooCommerce emiten DTEs ante el SII de forma nativa. Conectar antes de la primera venta un emisor externo autorizado: <strong>Bsale, OpenFactura o Haulmer</strong> mediante su app oficial para emitir automáticamente Boleta Electrónica (DTE 39) y despacharla por email al comprador.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
