import React, { useState } from 'react';
import { SPRINT_7_DAYS } from '../data/blueprintData';
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock, 
  RotateCcw, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Award,
  FileDown
} from 'lucide-react';
import { generateBusinessPlanPDF } from '../utils/pdfExport';

interface Sprint7DaysProps {
  completedTasks: { [taskId: string]: boolean };
  onToggleTask: (taskId: string) => void;
  onResetAllTasks: () => void;
  onCheckAllTasks: () => void;
  exchangeRate?: number;
}

export const Sprint7Days: React.FC<Sprint7DaysProps> = ({
  completedTasks,
  onToggleTask,
  onResetAllTasks,
  onCheckAllTasks,
  exchangeRate = 940
}) => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Compute progress
  const allTaskIds = SPRINT_7_DAYS.flatMap((d) => d.tasks.map((t) => t.id));
  const totalTasks = allTaskIds.length;
  const completedCount = allTaskIds.filter((id) => completedTasks[id]).length;
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const handleExportPDF = () => {
    try {
      setDownloadingPdf(true);
      generateBusinessPlanPDF({
        exchangeRate,
        completedTasks,
        exportScope: 'complete'
      });
    } catch (err) {
      console.error('Error al generar PDF del Sprint:', err);
    } finally {
      setTimeout(() => setDownloadingPdf(false), 1200);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header with Progress Dashboard */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-stone-900 text-white rounded-xl">
                <Calendar className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-stone-900">
                Plan de Acción: Próximos 7 Días (Sprint de Lanzamiento)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
              Secuencia táctica día por día para pasar de cero a tu primera campaña en vivo vendiendo a todo Chile de forma legal y rentable.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={downloadingPdf}
              className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              title="Descargar Plan de Negocios en PDF con el estado actual de tus tareas"
            >
              <FileDown className="w-3.5 h-3.5 text-amber-400" />
              <span>{downloadingPdf ? 'Generando PDF...' : 'Descargar Plan en PDF'}</span>
            </button>
            <button
              onClick={onResetAllTasks}
              className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg text-xs transition-colors"
              title="Reiniciar progreso"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onCheckAllTasks}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg transition-colors"
            >
              Marcar Todo
            </button>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="mt-5 pt-4 border-t border-stone-100 space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-stone-700 flex items-center gap-1.5">
              <span>Progreso Global del Sprint:</span>
              <strong className="text-stone-900">{completedCount} de {totalTasks} tareas completadas</strong>
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-emerald-700 font-bold">{progressPct}%</span>
              <button
                onClick={handleExportPDF}
                className="text-[11px] text-stone-500 hover:text-stone-900 underline flex items-center gap-1 font-normal ml-2"
              >
                <FileDown className="w-3 h-3 text-stone-400" />
                <span>Exportar estado a PDF</span>
              </button>
            </div>
          </div>

          <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {progressPct === 100 && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>¡Felicitaciones! Has completado el Blueprint Operativo.</strong> Tu tienda está formalizada en el SII, con pasarelas Webpay/Mercado Pago conectadas, catálogo curado y pauta de TikTok Ads lista para generar tus primeras conversiones.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 7 Days Timeline Cards */}
      <div className="space-y-4">
        {SPRINT_7_DAYS.map((dayItem) => {
          const dayTasks = dayItem.tasks;
          const dayCompletedCount = dayTasks.filter((t) => completedTasks[t.id]).length;
          const isDayDone = dayCompletedCount === dayTasks.length;

          return (
            <div
              key={dayItem.day}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isDayDone
                  ? 'bg-emerald-50/20 border-emerald-200'
                  : 'bg-white border-stone-200 shadow-sm'
              }`}
            >
              {/* Day Header */}
              <div className="p-4 sm:p-5 bg-stone-50/80 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                      isDayDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-900 text-white'
                    }`}
                  >
                    D{dayItem.day}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-stone-900">
                        {dayItem.title}
                      </h3>
                      {isDayDone && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Completado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {dayItem.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{dayItem.timeEst}</span>
                  </span>
                  <span className="font-mono font-semibold px-2 py-0.5 rounded bg-stone-200 text-stone-800">
                    {dayCompletedCount}/{dayTasks.length}
                  </span>
                </div>
              </div>

              {/* Tasks List */}
              <div className="p-4 sm:p-5 divide-y divide-stone-100">
                {dayTasks.map((task) => {
                  const isDone = Boolean(completedTasks[task.id]);

                  return (
                    <div
                      key={task.id}
                      onClick={() => onToggleTask(task.id)}
                      className={`py-3 first:pt-0 last:pb-0 flex items-start gap-3 cursor-pointer group transition-colors`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 text-stone-400 group-hover:text-stone-700 transition-colors shrink-0"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-stone-300" />
                        )}
                      </button>

                      <div className="text-xs space-y-0.5">
                        <div
                          className={`font-semibold transition-colors ${
                            isDone
                              ? 'text-stone-400 line-through'
                              : 'text-stone-900 group-hover:text-stone-950'
                          }`}
                        >
                          {task.text}
                        </div>
                        <p className={`text-stone-500 leading-relaxed ${isDone ? 'opacity-60' : ''}`}>
                          {task.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Sources Consulted Banner (Sept 2026) */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 text-xs text-stone-600 space-y-2">
        <div className="font-bold text-stone-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
          <ShieldCheck className="w-4 h-4 text-stone-700" />
          <span>Fuentes Clave Oficiales Consultadas (Septiembre 2026)</span>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-600 pt-1">
          <li className="flex items-center gap-1.5">
            <span className="text-stone-400">•</span>
            <span><strong>Transbank:</strong> Tarifas Webpay Plus (Crédito 2,35%, Débito 1,75% + IVA)</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="text-stone-400">•</span>
            <span><strong>SII:</strong> Facturación y boleta electrónica (DTE 39/33), Ley N°21.713</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="text-stone-400">•</span>
            <span><strong>Shopify Chile:</strong> Tarifas de suscripción y pasarelas externas autorizadas</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="text-stone-400">•</span>
            <span><strong>Meta:</strong> Guías 2026 de Advantage+ Shopping Campaigns (ASC) y Conversions API</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
