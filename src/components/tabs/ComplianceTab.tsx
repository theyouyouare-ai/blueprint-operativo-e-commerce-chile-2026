import React, { useState, useEffect, useMemo } from 'react';
import { 
  SII_ECOMMERCE_CODES,
  auditTaxRiskLevel,
  calculateF29TaxImpact,
  generateTermsAndConditions,
  generateReturnPolicy,
  generatePrivacyPolicy,
  TaxAuditRiskInput,
  LegalPolicyParams
} from '../../lib/compliance-engine';
import { formatCLP, formatUSD } from '../../utils/calculator';
import { 
  Scale, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Building2, 
  CheckCircle2, 
  Copy, 
  Check, 
  Download, 
  Calculator, 
  ArrowRight, 
  ExternalLink,
  HelpCircle,
  Clock,
  Briefcase,
  Layers,
  FileSpreadsheet,
  Receipt,
  FileCheck2,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ComplianceTabProps {
  exchangeRate: number;
}

export const ComplianceTab: React.FC<ComplianceTabProps> = ({ exchangeRate }) => {
  // ----------------------------------------------------
  // SECTION 1: Formalization Checklist State
  // ----------------------------------------------------
  const [completedSteps, setCompletedSteps] = useState<{ [key: string]: boolean }>(() => {
    try {
      const saved = localStorage.getItem('compliance_steps_2026');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      step_1: true,
      step_2: true,
      step_3: false,
      step_4: false,
      step_5: false,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('compliance_steps_2026', JSON.stringify(completedSteps));
    } catch (e) {
      console.error(e);
    }
  }, [completedSteps]);

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const totalSteps = 5;
  const completedStepsCount = Object.values(completedSteps).filter(Boolean).length;
  const formalizationPct = Math.round((completedStepsCount / totalSteps) * 100);

  // ----------------------------------------------------
  // SECTION 2: F29 & Customs Simulator State
  // ----------------------------------------------------
  const [salesGrossCLP, setSalesGrossCLP] = useState<number>(10000000); // 10M CLP en ventas brutas
  const [importsCIF_USD, setImportsCIF_USD] = useState<number>(3500); // 3.500 USD en importaciones
  const [hasRUTInAduana, setHasRUTInAduana] = useState<boolean>(true);
  const [domesticExpensesCLP, setDomesticExpensesCLP] = useState<number>(800000); // Insumos/software locales

  const f29Result = useMemo(() => {
    return calculateF29TaxImpact({
      monthlySalesGrossCLP: salesGrossCLP,
      monthlyImportsCIF_USD: importsCIF_USD,
      exchangeRate,
      hasCustomsProofWithRUT: hasRUTInAduana,
      domesticPurchasesNetCLP: domesticExpensesCLP
    });
  }, [salesGrossCLP, importsCIF_USD, exchangeRate, hasRUTInAduana, domesticExpensesCLP]);

  // ----------------------------------------------------
  // SECTION 3: Tax Risk Questionnaire State
  // ----------------------------------------------------
  const [riskInput, setRiskInput] = useState<TaxAuditRiskInput>({
    monthlyImportUSD: 3500,
    hasRUTEmpresa: true,
    emitsDTE: true,
    importsOver500USDCount: 0,
    usesCustomsBrokerForLargeShipments: true,
    declaresAllPurchasesInRCV: true,
    bankAccountType: 'empresa'
  });

  const auditResult = useMemo(() => {
    return auditTaxRiskLevel(riskInput);
  }, [riskInput]);

  // ----------------------------------------------------
  // SECTION 4: Legal Documents Generator State
  // ----------------------------------------------------
  const [policyParams, setPolicyParams] = useState<LegalPolicyParams>({
    storeName: 'Aura Market Chile',
    legalEntityName: 'Comercializadora e Inversiones Aura SpA',
    companyRUT: '77.892.341-8',
    legalAddress: 'Av. Providencia 1208, Of. 602',
    city: 'Santiago',
    supportEmail: 'contacto@auramarket.cl',
    supportPhone: '+56 9 8452 1190',
    deliveryDaysMin: 2,
    deliveryDaysMax: 5,
    warrantyMonths: 6,
    courtesyReturnDays: 10
  });

  const [activeDocument, setActiveDocument] = useState<'terms' | 'returns' | 'privacy'>('returns');
  const [viewFormat, setViewFormat] = useState<'preview' | 'markdown' | 'html'>('preview');
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Active generated raw markdown text
  const currentMarkdown = useMemo(() => {
    if (activeDocument === 'terms') return generateTermsAndConditions(policyParams);
    if (activeDocument === 'returns') return generateReturnPolicy(policyParams);
    return generatePrivacyPolicy(policyParams);
  }, [activeDocument, policyParams]);

  // Quick converter to basic HTML
  const currentHTML = useMemo(() => {
    return currentMarkdown
      .split('\n\n')
      .map(p => {
        if (p.startsWith('# ')) return `<h1>${p.replace('# ', '')}</h1>`;
        if (p.startsWith('### ')) return `<h3>${p.replace('### ', '')}</h3>`;
        if (p.startsWith('- ')) {
          const items = p.split('\n').map(li => `  <li>${li.replace('- ', '')}</li>`).join('\n');
          return `<ul>\n${items}\n</ul>`;
        }
        return `<p>${p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`;
      })
      .join('\n');
  }, [currentMarkdown]);

  const handleCopyCode = async () => {
    try {
      const textToCopy = viewFormat === 'html' ? currentHTML : currentMarkdown;
      await navigator.clipboard.writeText(textToCopy);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadFile = () => {
    const element = document.createElement('a');
    const file = new Blob([currentMarkdown], { type: 'text/markdown;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${activeDocument}_chile_2026.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-2 bg-stone-900 text-white rounded-xl">
                <Scale className="w-5 h-5 text-amber-300" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Tab 4: Compliance, Legal & Operativa SII (Ley N° 21.713)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 max-w-3xl leading-relaxed">
              Guía técnica, operativa y tributaria para blindar tu tienda e-commerce en Chile ante el <strong>Servicio de Impuestos Internos (SII)</strong>, <strong>Servicio Nacional de Aduanas</strong> y la <strong>Ley del Consumidor (SERNAC)</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">Formalización Comercial</span>
              <span className="text-lg font-mono font-bold text-stone-900">{formalizationPct}% Completo</span>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-stone-200 flex items-center justify-center font-bold text-xs">
              <span className={formalizationPct === 100 ? 'text-emerald-600' : 'text-amber-600'}>
                {completedStepsCount}/5
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Step-by-Step Formalization Checklist */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-stone-800" />
              <span>1. Checklist Interactivo de Formalización Comercial en Chile</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Ruta crítica de 5 pasos para obtener RUT corporativo, acreditar domicilio y habilitar DTE afectos a IVA.
            </p>
          </div>

          <div className="w-full sm:w-48">
            <div className="flex justify-between text-[11px] font-semibold text-stone-600 mb-1">
              <span>Progreso:</span>
              <span>{formalizationPct}%</span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-2">
              <div
                className="bg-stone-900 h-2 rounded-full transition-all duration-300"
                style={{ width: `${formalizationPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* 5 Step Accordion / Cards */}
        <div className="space-y-3">
          {/* Step 1 */}
          <div className={`p-4 rounded-xl border transition-all ${
            completedSteps.step_1 ? 'bg-stone-50/70 border-stone-200' : 'bg-white border-stone-300 shadow-xs'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="step_1"
                  checked={completedSteps.step_1}
                  onChange={() => toggleStep('step_1')}
                  className="w-4 h-4 mt-1 rounded text-stone-900 focus:ring-0 cursor-pointer"
                />
                <div>
                  <label htmlFor="step_1" className="text-sm font-bold text-stone-900 cursor-pointer flex items-center gap-2">
                    <span>Paso 1: Constitución de Sociedad SpA (&quot;Tu Empresa en un Día&quot;)</span>
                    {completedSteps.step_1 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                        Completado
                      </span>
                    )}
                  </label>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    Creación mediante el Registro de Empresas y Sociedades (RES). Se recomienda <strong>Sociedad por Acciones (SpA)</strong> por su flexibilidad de 1 o más accionistas y facilidad para emitir o ceder acciones ante inversionistas.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] text-stone-600">
                    <span className="px-2 py-1 bg-stone-100 rounded-md border border-stone-200">
                      📄 Estatuto Tipo SpA
                    </span>
                    <span className="px-2 py-1 bg-stone-100 rounded-md border border-stone-200">
                      🔑 Firma Electrónica Avanzada (~$1.500 CLP) o Notaría
                    </span>
                    <span className="px-2 py-1 bg-stone-100 rounded-md border border-stone-200">
                      ⏱️ Tiempo estimado: 24 horas
                    </span>
                  </div>
                </div>
              </div>
              <a
                href="https://www.tuempresaenundia.cl"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1 shrink-0 p-1.5 hover:bg-stone-100 rounded-lg"
              >
                <span>RES</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Step 2 */}
          <div className={`p-4 rounded-xl border transition-all ${
            completedSteps.step_2 ? 'bg-stone-50/70 border-stone-200' : 'bg-white border-stone-300 shadow-xs'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="step_2"
                  checked={completedSteps.step_2}
                  onChange={() => toggleStep('step_2')}
                  className="w-4 h-4 mt-1 rounded text-stone-900 focus:ring-0 cursor-pointer"
                />
                <div>
                  <label htmlFor="step_2" className="text-sm font-bold text-stone-900 cursor-pointer flex items-center gap-2">
                    <span>Paso 2: Obtención de RUT Empresa e Inicio de Actividades en 1ra Categoría (SII)</span>
                    {completedSteps.step_2 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                        Completado
                      </span>
                    )}
                  </label>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    Trámite 100% online en el portal del SII con la ClaveÚnica del representante legal. Declara inicio de actividades en <strong>Primera Categoría</strong> bajo el régimen tributario <strong>Pro-Pyme General (14 D3) o Pro-Pyme Transparente (14 D8)</strong>.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] text-stone-600">
                    <span className="px-2 py-1 bg-stone-100 rounded-md border border-stone-200">
                      💻 sii.cl &gt; Servicios online &gt; RUT e Inicio de Actividades
                    </span>
                    <span className="px-2 py-1 bg-stone-100 rounded-md border border-stone-200">
                      ⚡ Plazo legal: Dentro de los 2 meses siguientes a la primera venta o compra
                    </span>
                  </div>
                </div>
              </div>
              <a
                href="https://www.sii.cl"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1 shrink-0 p-1.5 hover:bg-stone-100 rounded-lg"
              >
                <span>SII</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Step 3 */}
          <div className={`p-4 rounded-xl border transition-all ${
            completedSteps.step_3 ? 'bg-stone-50/70 border-stone-200' : 'bg-white border-stone-300 shadow-xs'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="step_3"
                  checked={completedSteps.step_3}
                  onChange={() => toggleStep('step_3')}
                  className="w-4 h-4 mt-1 rounded text-stone-900 focus:ring-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <label htmlFor="step_3" className="text-sm font-bold text-stone-900 cursor-pointer flex items-center gap-2">
                    <span>Paso 3: Acreditación de Domicilio & Códigos de Actividad Económica E-commerce</span>
                    {completedSteps.step_3 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                        Completado
                      </span>
                    )}
                  </label>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    El SII exige acreditar domicilio tributario dentro de 60 días para autorizar emisión de DTEs y timbraje electrónico. Puedes utilizar un <strong>Domicilio Tributario Virtual / Cowork</strong> ($10.000 - $18.000 CLP/mes) o contrato de arriendo a nombre de la SpA.
                  </p>
                  
                  {/* Activity Codes Selector Table */}
                  <div className="pt-2">
                    <span className="text-xs font-bold text-stone-800 block mb-1.5">
                      Códigos SII Obligatorios y Recomendados para E-commerce en Chile:
                    </span>
                    <div className="overflow-x-auto border border-stone-200 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                            <th className="py-2 px-2.5">Código SII</th>
                            <th className="py-2 px-2.5">Glosa de Actividad</th>
                            <th className="py-2 px-2.5">IVA</th>
                            <th className="py-2 px-2.5">Uso Recomendado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 bg-white">
                          {SII_ECOMMERCE_CODES.map((item) => (
                            <tr key={item.code} className="hover:bg-stone-50">
                              <td className="py-2 px-2.5 font-mono font-bold text-stone-900">{item.code}</td>
                              <td className="py-2 px-2.5 font-medium">{item.name}</td>
                              <td className="py-2 px-2.5">
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded font-semibold text-[10px]">
                                  {item.vatStatus}
                                </span>
                              </td>
                              <td className="py-2 px-2.5 text-stone-600 text-[11px]">{item.recommendedFor}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className={`p-4 rounded-xl border transition-all ${
            completedSteps.step_4 ? 'bg-stone-50/70 border-stone-200' : 'bg-white border-stone-300 shadow-xs'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="step_4"
                  checked={completedSteps.step_4}
                  onChange={() => toggleStep('step_4')}
                  className="w-4 h-4 mt-1 rounded text-stone-900 focus:ring-0 cursor-pointer"
                />
                <div>
                  <label htmlFor="step_4" className="text-sm font-bold text-stone-900 cursor-pointer flex items-center gap-2">
                    <span>Paso 4: Habilitación de Facturación Electrónica (Boleta DTE 39 & Factura DTE 33)</span>
                    {completedSteps.step_4 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                        Completado
                      </span>
                    )}
                  </label>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    Obligatorio bajo la Ley N° 21.713 para conciliar automáticamente las ventas con las pasarelas (Webpay Plus / Mercado Pago). Conecta el sistema gratuito del SII o una app certificada como <strong>LibreDTE, Bsale, OpenFactura o SimpleBoleta</strong> para emitir boletas electrónicas en automático tras cada checkout.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] text-stone-600">
                    <span className="px-2 py-1 bg-stone-100 rounded-md border border-stone-200">
                      🧾 Boleta Electrónica de Ventas (DTE 39) - Afecta a IVA 19%
                    </span>
                    <span className="px-2 py-1 bg-stone-100 rounded-md border border-stone-200">
                      📄 Factura Electrónica (DTE 33) - Para clientes empresas con RUT
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className={`p-4 rounded-xl border transition-all ${
            completedSteps.step_5 ? 'bg-stone-50/70 border-stone-200' : 'bg-white border-stone-300 shadow-xs'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="step_5"
                  checked={completedSteps.step_5}
                  onChange={() => toggleStep('step_5')}
                  className="w-4 h-4 mt-1 rounded text-stone-900 focus:ring-0 cursor-pointer"
                />
                <div>
                  <label htmlFor="step_5" className="text-sm font-bold text-stone-900 cursor-pointer flex items-center gap-2">
                    <span>Paso 5: Obtención de Patente Municipal Comercial</span>
                    {completedSteps.step_5 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                        Completado
                      </span>
                    )}
                  </label>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    Toda actividad comercial lucrativa en Chile requiere patente municipal en la comuna del domicilio tributario (ej: Santiago, Providencia, Las Condes). El trámite de patente comercial provisoria o definitiva para oficina virtual o comercio digital se realiza en el Departamento de Rentas Municipal.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] text-stone-600">
                    <span className="px-2 py-1 bg-stone-100 rounded-md border border-stone-200">
                      🏛️ Costo semestral: ~2,5 a 5 por mil del capital propio tributario (mínimo legal ~0,5 a 1 UTM)
                    </span>
                    <span className="px-2 py-1 bg-stone-100 rounded-md border border-stone-200">
                      📌 Exención de impacto vecinal al ser comercio electrónico sin atención de público
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Customs & F29 Tax Engine Module (Ley N° 21.713) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-stone-800" />
              <span>2. Cumplimiento Tributario de Importación & Simulador F29 (Ley N° 21.713)</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Matriz de fiscalización aduanera y mecanismo de acreditación del IVA importación como Crédito Fiscal compensable.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
            Normativa Aduanas Chile 2026
          </span>
        </div>

        {/* Customs Regimes 3-Column Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900">1. Régimen Courier Express</span>
              <span className="text-[10px] font-mono bg-stone-200 text-stone-800 px-1.5 py-0.5 rounded">
                $\le$ US$ 500 CIF
              </span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Envíos transportados por DHL, FedEx, UPS o Correos de Chile. El courier actúa como despachador oficial.
            </p>
            <div className="space-y-1 text-[11px] pt-1 border-t border-stone-200">
              <div className="flex justify-between">
                <span className="text-stone-500">Arancel aduanero:</span>
                <span className="font-semibold text-emerald-700">0% (Exento)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">IVA Importación:</span>
                <span className="font-semibold text-rose-700">19% (Obligatorio)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Agente de Aduana:</span>
                <span className="font-semibold text-stone-800">No requerido</span>
              </div>
              <p className="text-[10px] text-amber-800 font-medium pt-1">
                ⚠️ Clave: Pide al courier que registre tu RUT SpA para recuperar el IVA.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900">2. Declaración de Ingreso (DIN)</span>
              <span className="text-[10px] font-mono bg-stone-200 text-stone-800 px-1.5 py-0.5 rounded">
                &gt; US$ 500 CIF
              </span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Importación general comercial. La Ordenanza de Aduanas exige obligatoriamente un Agente de Aduanas matriculado.
            </p>
            <div className="space-y-1 text-[11px] pt-1 border-t border-stone-200">
              <div className="flex justify-between">
                <span className="text-stone-500">Arancel aduanero:</span>
                <span className="font-semibold text-amber-800">6% Ad-Valorem</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">IVA Importación:</span>
                <span className="font-semibold text-rose-700">19% sobre (CIF + Arancel)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Agente de Aduana:</span>
                <span className="font-semibold text-rose-700">Obligatorio por Ley</span>
              </div>
              <p className="text-[10px] text-emerald-800 font-medium pt-1">
                ✔ La DIN se refleja directamente en tu Registro de Compras (RCV).
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900">3. Retenciones Pasarelas</span>
              <span className="text-[10px] font-mono bg-stone-200 text-stone-800 px-1.5 py-0.5 rounded">
                Ley N° 21.713
              </span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Mercado Pago, Transbank y bancos reportan transacciones recurrentes directamente al SII de forma mensual.
            </p>
            <div className="space-y-1 text-[11px] pt-1 border-t border-stone-200">
              <div className="flex justify-between">
                <span className="text-stone-500">Sin RUT Empresa:</span>
                <span className="font-semibold text-rose-700">Retención preventiva IVA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Con RUT y DTE 39:</span>
                <span className="font-semibold text-emerald-700">0% Retención (Normal)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Fiscalización cruzada:</span>
                <span className="font-semibold text-stone-800">Automática vía API SII</span>
              </div>
              <p className="text-[10px] text-stone-600 font-medium pt-1">
                Emitir boleta electrónica libera el 100% de tus liquidaciones.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive F29 Tax Simulator */}
        <div className="pt-2">
          <div className="bg-stone-50 p-4 sm:p-5 rounded-xl border border-stone-200 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-stone-800" />
                <h4 className="text-sm font-bold text-stone-900">
                  Simulador de Formulario 29 (F29): IVA Débito vs. IVA Crédito Fiscal
                </h4>
              </div>
              <span className="text-xs text-stone-500">
                Tasa de cambio: <strong>USD 1 = CLP ${exchangeRate}</strong>
              </span>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Ventas Brutas al Mes (PVP con IVA)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs font-mono text-stone-400">CLP $</span>
                  <input
                    type="number"
                    step="500000"
                    value={salesGrossCLP}
                    onChange={(e) => setSalesGrossCLP(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full pl-14 pr-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-stone-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Importación Mensual CIF (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs font-mono text-stone-400">USD $</span>
                  <input
                    type="number"
                    step="200"
                    value={importsCIF_USD}
                    onChange={(e) => setImportsCIF_USD(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full pl-14 pr-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-stone-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Compras & Gastos Locales Netos
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs font-mono text-stone-400">CLP $</span>
                  <input
                    type="number"
                    step="100000"
                    value={domesticExpensesCLP}
                    onChange={(e) => setDomesticExpensesCLP(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full pl-14 pr-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-stone-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  ¿Acreditaste RUT SpA en Aduanas?
                </label>
                <button
                  type="button"
                  onClick={() => setHasRUTInAduana(!hasRUTInAduana)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-2 ${
                    hasRUTInAduana
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  {hasRUTInAduana ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  <span>{hasRUTInAduana ? 'Sí, recupero IVA' : 'No, opero informal'}</span>
                </button>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="p-3 bg-white rounded-xl border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">IVA Débito Fiscal (19%)</span>
                <span className="text-base font-bold font-mono text-stone-900 block mt-0.5">
                  {formatCLP(f29Result.ivaDebitoFiscalCLP)}
                </span>
                <span className="text-[10px] text-stone-500">Cobrado a clientes por boletas</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">IVA Crédito Fiscal (Total)</span>
                <span className="text-base font-bold font-mono text-emerald-700 block mt-0.5">
                  {formatCLP(f29Result.totalIvaCreditoFiscalCLP)}
                </span>
                <span className="text-[10px] text-stone-500">
                  Aduana: {formatCLP(f29Result.ivaCreditoFiscalImportCLP)} | Local: {formatCLP(f29Result.ivaCreditoFiscalLocalCLP)}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Pago Neto F29 al SII</span>
                <span className="text-base font-bold font-mono text-stone-900 block mt-0.5">
                  {f29Result.hasRemanente ? 'Remanente a favor' : formatCLP(f29Result.netF29TaxPayableCLP)}
                </span>
                <span className="text-[10px] text-stone-500">
                  {f29Result.hasRemanente ? 'Se acumula para el mes siguiente' : 'Impuesto líquido a pagar'}
                </span>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-amber-900 block">Ahorro Anual por Formalizarse</span>
                <span className="text-base font-bold font-mono text-amber-900 block mt-0.5">
                  {formatCLP(f29Result.formalizationSavingsAnnualCLP)}
                </span>
                <span className="text-[10px] text-amber-800">
                  {hasRUTInAduana ? '✔ Dinero que no pierdes' : '⚠️ Dinero que regalas por informalidad'}
                </span>
              </div>
            </div>

            {!hasRUTInAduana && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">¡Estás perdiendo {formatCLP(f29Result.lostTaxCreditCLP)} al mes!</span>
                  <p className="leading-relaxed">
                    Al no consignar el RUT de tu SpA en el despacho courier, el IVA del 19% pagado en Aduana se convierte en un costo no recuperable en lugar de ser un Crédito Fiscal descontable en tu F29.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Tax Risk Auditor Mini-Module */}
        <div className="pt-2 border-t border-stone-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-stone-800" />
              <span>Auditor de Nivel de Riesgo Tributario (Ley N° 21.713)</span>
            </h4>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              auditResult.riskLevel === 'Bajo'
                ? 'bg-emerald-100 text-emerald-800'
                : auditResult.riskLevel === 'Medio'
                ? 'bg-amber-100 text-amber-900'
                : 'bg-rose-100 text-rose-900'
            }`}>
              Riesgo: {auditResult.riskLevel} (Score: {auditResult.riskScore}/100)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs">
              <span className="font-bold text-stone-800 block">Configura tu Perfil Operativo:</span>

              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <span className="text-stone-700">¿Operas con RUT Empresa formal (SpA/EIRL)?</span>
                <input
                  type="checkbox"
                  checked={riskInput.hasRUTEmpresa}
                  onChange={(e) => setRiskInput({ ...riskInput, hasRUTEmpresa: e.target.checked })}
                  className="rounded text-stone-900 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <span className="text-stone-700">¿Emite tu tienda Boleta Electrónica (DTE 39)?</span>
                <input
                  type="checkbox"
                  checked={riskInput.emitsDTE}
                  onChange={(e) => setRiskInput({ ...riskInput, emitsDTE: e.target.checked })}
                  className="rounded text-stone-900 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <span className="text-stone-700">¿Envías compras por más de USD 500 sin Agente?</span>
                <input
                  type="checkbox"
                  checked={riskInput.importsOver500USDCount > 0}
                  onChange={(e) => setRiskInput({ 
                    ...riskInput, 
                    importsOver500USDCount: e.target.checked ? 1 : 0,
                    usesCustomsBrokerForLargeShipments: !e.target.checked 
                  })}
                  className="rounded text-stone-900 focus:ring-0"
                />
              </label>

              <div className="flex items-center justify-between gap-2">
                <span className="text-stone-700">Cuenta bancaria de recaudación:</span>
                <select
                  value={riskInput.bankAccountType}
                  onChange={(e) => setRiskInput({ ...riskInput, bankAccountType: e.target.value as 'personal' | 'empresa' })}
                  className="px-2 py-1 bg-white border border-stone-300 rounded text-xs"
                >
                  <option value="empresa">Cuenta Corriente Empresa</option>
                  <option value="personal">Cuenta RUT / Personal (Riesgoso)</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-stone-200 bg-white space-y-2 text-xs">
              <span className="font-bold text-stone-800 block">Dictamen del Auditor:</span>
              <p className="text-stone-600 leading-relaxed font-medium">
                {auditResult.summary}
              </p>

              {auditResult.reasons.length > 0 && (
                <div className="pt-2 space-y-1">
                  <span className="text-[11px] font-bold text-stone-700 block">Factores de Riesgo:</span>
                  {auditResult.reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-stone-600 text-[11px]">
                      <span className="text-rose-500 font-bold shrink-0">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}

              {auditResult.mitigations.length > 0 && (
                <div className="pt-2 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-800 block">Acción Inmediata Recomendada:</span>
                  {auditResult.mitigations.map((m, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-emerald-700 text-[11px]">
                      <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Legal Document & SERNAC Policy Generator */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-stone-800" />
              <span>3. Generador de Documentos Legales & Políticas SERNAC (Garantía 6 Meses)</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Redactado según la Ley N° 19.496, Decreto Supremo N° 6 y Ley N° 19.628 de Privacidad. Listo para pegar en Shopify o WooCommerce.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedNotification ? '¡Copiado al Portapapeles!' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={handleDownloadFile}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .md</span>
            </button>
          </div>
        </div>

        {/* Store Parameters Form */}
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
            Datos de tu Tienda para Personalizar los Documentos:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Nombre Comercial Tienda</label>
              <input
                type="text"
                value={policyParams.storeName}
                onChange={(e) => setPolicyParams({ ...policyParams, storeName: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded border border-stone-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Razón Social SpA</label>
              <input
                type="text"
                value={policyParams.legalEntityName}
                onChange={(e) => setPolicyParams({ ...policyParams, legalEntityName: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded border border-stone-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">RUT Empresa</label>
              <input
                type="text"
                value={policyParams.companyRUT}
                onChange={(e) => setPolicyParams({ ...policyParams, companyRUT: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded border border-stone-300 bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Email de Soporte</label>
              <input
                type="text"
                value={policyParams.supportEmail}
                onChange={(e) => setPolicyParams({ ...policyParams, supportEmail: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded border border-stone-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Domicilio Legal</label>
              <input
                type="text"
                value={policyParams.legalAddress}
                onChange={(e) => setPolicyParams({ ...policyParams, legalAddress: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded border border-stone-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Ciudad</label>
              <input
                type="text"
                value={policyParams.city}
                onChange={(e) => setPolicyParams({ ...policyParams, city: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded border border-stone-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">WhatsApp de Atención</label>
              <input
                type="text"
                value={policyParams.supportPhone}
                onChange={(e) => setPolicyParams({ ...policyParams, supportPhone: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded border border-stone-300 bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Plazo de Despacho (Días Hábiles)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={policyParams.deliveryDaysMin}
                  onChange={(e) => setPolicyParams({ ...policyParams, deliveryDaysMin: parseInt(e.target.value) || 1 })}
                  className="w-14 px-2 py-1.5 rounded border border-stone-300 bg-white font-mono text-center"
                />
                <span className="text-stone-400">a</span>
                <input
                  type="number"
                  value={policyParams.deliveryDaysMax}
                  onChange={(e) => setPolicyParams({ ...policyParams, deliveryDaysMax: parseInt(e.target.value) || 5 })}
                  className="w-14 px-2 py-1.5 rounded border border-stone-300 bg-white font-mono text-center"
                />
                <span className="text-stone-500">días</span>
              </div>
            </div>
          </div>
        </div>

        {/* Document Switcher & Format Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
          {/* Document Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveDocument('returns')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeDocument === 'returns'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              1. Política de Devoluciones (Garantía 6 Meses)
            </button>
            <button
              onClick={() => setActiveDocument('terms')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeDocument === 'terms'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              2. Términos & Condiciones
            </button>
            <button
              onClick={() => setActiveDocument('privacy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeDocument === 'privacy'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              3. Política de Privacidad
            </button>
          </div>

          {/* View Format Selector */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs">
            <button
              onClick={() => setViewFormat('preview')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                viewFormat === 'preview' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-600'
              }`}
            >
              Vista Previa
            </button>
            <button
              onClick={() => setViewFormat('markdown')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                viewFormat === 'markdown' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-600'
              }`}
            >
              Markdown
            </button>
            <button
              onClick={() => setViewFormat('html')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                viewFormat === 'html' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-600'
              }`}
            >
              HTML
            </button>
          </div>
        </div>

        {/* Document Viewer Box */}
        <div className="border border-stone-200 rounded-xl overflow-hidden bg-stone-50/40">
          {viewFormat === 'preview' ? (
            <div className="p-5 sm:p-6 bg-white max-h-[500px] overflow-y-auto space-y-4 text-xs sm:text-sm text-stone-800 leading-relaxed font-sans">
              <div className="prose prose-stone max-w-none">
                {currentMarkdown.split('\n\n').map((paragraph, index) => {
                  if (paragraph.startsWith('# ')) {
                    return (
                      <h2 key={index} className="text-lg sm:text-xl font-bold text-stone-900 border-b border-stone-200 pb-2 mb-3">
                        {paragraph.replace('# ', '')}
                      </h2>
                    );
                  }
                  if (paragraph.startsWith('### ')) {
                    return (
                      <h4 key={index} className="text-sm sm:text-base font-bold text-stone-900 mt-4 mb-1">
                        {paragraph.replace('### ', '')}
                      </h4>
                    );
                  }
                  if (paragraph.startsWith('- ')) {
                    const items = paragraph.split('\n');
                    return (
                      <ul key={index} className="list-disc pl-5 space-y-1 text-stone-700 my-2">
                        {items.map((it, idx) => (
                          <li key={idx}>{it.replace('- ', '')}</li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p key={index} className="text-stone-700 leading-relaxed">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-stone-900 text-amber-200 font-mono text-xs max-h-[500px] overflow-y-auto">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {viewFormat === 'html' ? currentHTML : currentMarkdown}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
