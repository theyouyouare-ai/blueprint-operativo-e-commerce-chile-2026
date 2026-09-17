import React, { useState } from 'react';
import { UGC_SCRIPTS } from '../data/blueprintData';
import { 
  Megaphone, 
  Video, 
  Copy, 
  Check, 
  Sliders, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  TrendingUp,
  DollarSign,
  Radio,
  Eye,
  CheckCircle2
} from 'lucide-react';

export const TrafficAndAdsStrategy: React.FC = () => {
  const [dailyBudgetUSD, setDailyBudgetUSD] = useState<number>(8);
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);

  // Pixel checklist state
  const [pixelChecks, setPixelChecks] = useState<{ [key: string]: boolean }>({
    tiktokPixel: true,
    metaPixelCapi: false,
    domainVerify: false,
    eventsCheck: false,
    advancedMatch: false
  });

  const togglePixelCheck = (id: string) => {
    setPixelChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyScript = (scriptId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScriptId(scriptId);
    setTimeout(() => setCopiedScriptId(null), 2500);
  };

  const isLowBudget = dailyBudgetUSD < 20;

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-stone-900 text-white rounded-xl">
            <Megaphone className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-stone-900">
              FASE 4 — Estrategia de Lanzamiento y Tráfico Pagado (2026)
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Corrección del algoritmo Meta (Advantage+ Shopping), TikTok Ads Broad como canal primario y guiones UGC.
            </p>
          </div>
        </div>
      </div>

      {/* Budget Selector Simulator Banner */}
      <div className="bg-stone-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Simulador de Asignación de Presupuesto Diario
            </span>
            <h3 className="text-lg font-bold text-white">
              ¿Cuál es tu presupuesto real de pauta al día?
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono text-amber-300">
              USD ${dailyBudgetUSD}/día
            </span>
            <span className="text-xs text-stone-400 font-mono">
              (~CLP ${(dailyBudgetUSD * 940).toLocaleString('es-CL')})
            </span>
          </div>
        </div>

        <input
          type="range"
          min="5"
          max="60"
          step="1"
          value={dailyBudgetUSD}
          onChange={(e) => setDailyBudgetUSD(parseInt(e.target.value) || 5)}
          className="w-full accent-amber-400 cursor-pointer"
        />

        <div className="p-3.5 rounded-xl bg-stone-800/90 border border-stone-700 text-xs leading-relaxed">
          {isLowBudget ? (
            <div className="flex items-start gap-2.5">
              <span className="text-amber-400 font-bold text-sm">💡</span>
              <div>
                <strong className="text-amber-300">Veredicto para presupuesto bajo (&lt; USD $20/día):</strong>{' '}
                <span className="text-stone-200">
                  Usa exclusivamente <strong>TikTok Ads</strong> enfocado en el <strong>Grupo 1 (Broad)</strong>. No actives Meta Ads todavía: con USD ${dailyBudgetUSD}/día el píxel de Meta no alcanzará las 50 conversiones semanales para salir de la fase de aprendizaje y diluirás el capital. TikTok ofrece CPMs más económicos en Chile (~USD $1,20 - $2,50) y tracción con creativos UGC orgánicos.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5">
              <span className="text-emerald-400 font-bold text-sm">🚀</span>
              <div>
                <strong className="text-emerald-300">Veredicto para presupuesto de escalamiento (≥ USD $20/día):</strong>{' '}
                <span className="text-stone-200">
                  Activa la campaña <strong>Meta Advantage+ Shopping (ASC)</strong> con objetivo Ventas y Conversions API (CAPI). Puedes mantener una distribución 60% Meta ASC + 40% TikTok Ads Broad para diversificar adquisición entre audiencias de 18-28 años (TikTok) y 25-50 años (Instagram/Facebook).
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid: TikTok Ads vs Meta Advantage+ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: TikTok Ads Channel */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs">
                TT
              </span>
              <div>
                <h4 className="text-sm font-bold text-stone-900">TikTok Ads — Canal Primario</h4>
                <p className="text-[11px] text-stone-500">Ideal con presupuestos de USD 5-10/día</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Menor CPM Chile
            </span>
          </div>

          <div className="space-y-3 text-xs text-stone-700">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
              <div className="font-bold text-stone-900">Estructura de la Campaña:</div>
              <p>• 1 Campaña de Conversión con objetivo <strong>&quot;CompletePayment&quot;</strong>.</p>
              <p>• <strong>Grupo 1 (Broad):</strong> Sin restricciones de edad/interés. Concentra aquí el 100% del presupuesto si inviertes &lt; USD 15/día.</p>
              <p>• <strong>Grupo 2 (Interés):</strong> Segmentación general de la categoría (solo si Broad no arroja métricas claras en 3 días).</p>
              <p>• <strong>Grupo 3 (Retargeting):</strong> Visitantes del sitio en los últimos 30 días (activar recién en la semana 2 con 1.000+ visitas acumuladas).</p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
              <div className="font-bold text-stone-900">Ciclo de Testing:</div>
              <p>• 3 a 5 creativos UGC verticales por grupo.</p>
              <p>• Ventana de evaluación: <strong>3 a 4 días</strong> por tanda.</p>
              <p>• Métrica de descarte: si un creativo supera los USD $4 sin AddToCart o tiene CTR &lt; 0,8%, se apaga de inmediato y se reasigna el gasto al mejor video.</p>
            </div>

            {/* TikTok Shop Radar 2026 */}
            <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200/80 text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-amber-700" />
                <span>Radar TikTok Shop Chile (Septiembre 2026)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                TikTok ya opera directamente en el país y habilitó el registro de vendedores en su versión global, pero <strong>sin checkout nativo oficial aún</strong> (estimado Q3-Q4 2026). Registra la cuenta de comercio preventivamente, pero dirige hoy todo el tráfico a tu tienda web.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Meta Advantage+ Shopping */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                M
              </span>
              <div>
                <h4 className="text-sm font-bold text-stone-900">Meta Advantage+ Shopping (ASC)</h4>
                <p className="text-[11px] text-stone-500">Se suma cuando el presupuesto supere ~USD 20/día</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
              Algoritmo IA 2026
            </span>
          </div>

          <div className="space-y-3 text-xs text-stone-700">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
              <div className="font-bold text-stone-900">Cambio Radical sobre el Plan Original:</div>
              <p className="line-through text-stone-400">❌ 1 campaña con 3 conjuntos por intereses específicos</p>
              <p className="text-stone-900 font-semibold">
                ✔ 1 sola campaña Advantage+ Shopping Campaigns (ASC), objetivo Ventas, targeting amplio a todo Chile sin segmentación manual.
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
              <div className="font-bold text-stone-900">Configuración Técnica Recomendada:</div>
              <p>• <strong>5 a 8 creativos variados:</strong> mezcla de video UGC vertical (60%), imágenes con beneficios destacados (20%) y carrusel de variantes (20%).</p>
              <p>• <strong>Fase de Aprendizaje:</strong> dejar correr de 7 a 14 días sin tocar presupuestos ni apagar anuncios prematuramente.</p>
              <p>• <strong>Regla de Escala:</strong> escalar el presupuesto diario en incrementos de solo 20% a 25% cada 3-4 días para no reiniciar el algoritmo.</p>
            </div>

            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Conversions API (CAPI) Server-Side</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                No confíes únicamente en el píxel de navegador. El bloqueo de cookies de terceros e iOS pierde hasta un 35% de compras. Activar CAPI desde la app de Shopify/WooCommerce es mandatorio para que el algoritmo de Meta aprenda rápido.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Pixel & CAPI Setup Checklist */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-stone-700" />
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              Setup Técnico de Medición & Píxeles (Checklist de Verificación)
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-medium">Verificar antes de activar anuncios</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { id: 'tiktokPixel', label: 'Crear TikTok Ads Manager & Meta Business Manager' },
            { id: 'metaPixelCapi', label: 'Instalar Meta Pixel + Conversions API (CAPI server-side)' },
            { id: 'domainVerify', label: 'Verificar Dominio propio .cl/.com en Meta Business Manager' },
            { id: 'eventsCheck', label: 'Verificar eventos: ViewContent, AddToCart, Purchase' },
            { id: 'advancedMatch', label: 'Activar Enhanced/Advanced Matching (email y teléfono)' },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => togglePixelCheck(item.id)}
              className={`p-3 rounded-xl border cursor-pointer text-xs flex items-start gap-2.5 transition-all ${
                pixelChecks[item.id] ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-medium' : 'bg-stone-50 border-stone-200 text-stone-700'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {pixelChecks[item.id] ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <div className="w-4 h-4 rounded border border-stone-300 bg-white" />
                )}
              </div>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* UGC Scripts Interactive Hub */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-stone-700" />
            <h3 className="text-base font-bold text-stone-900">
              Estructuras de Guión UGC Vertical (Tiktok Reels / Shorts)
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Usa estos esquemas como esqueleto de grabación para tus creadores o para grabar tú mismo con el teléfono.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {UGC_SCRIPTS.map((script) => {
            const isCopied = copiedScriptId === script.id;
            const fullScriptText = `${script.angle} (${script.timing})\n\n` +
              script.structure.map(s => `[${s.phase} - ${s.timeSeconds}]\nAcción: ${s.visualAction}\nGuión: ${s.scriptPrompt}`).join('\n\n');

            return (
              <div
                key={script.id}
                className="bg-stone-50 rounded-xl p-5 border border-stone-200 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900">
                      {script.angle}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-200 text-stone-800">
                      ⏱ {script.timing}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 italic">
                    Objetivo: {script.targetObjective}
                  </p>

                  <div className="space-y-3 pt-2">
                    {script.structure.map((part, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-lg border border-stone-200 space-y-1 text-xs">
                        <div className="flex items-center justify-between font-bold text-stone-800">
                          <span>{part.phase} ({part.timeSeconds})</span>
                          <span className="text-[10px] text-stone-400 font-normal">{part.objective}</span>
                        </div>
                        <p className="text-stone-700 italic bg-amber-50/50 p-1.5 rounded border border-amber-100">
                          {part.scriptPrompt}
                        </p>
                        <div className="text-[11px] text-stone-500">
                          <strong className="text-stone-700">Toma visual:</strong> {part.visualAction}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleCopyScript(script.id, fullScriptText)}
                  className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors mt-2"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>¡Guión Copiado al Portapapeles!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Guión para Creador UGC</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
