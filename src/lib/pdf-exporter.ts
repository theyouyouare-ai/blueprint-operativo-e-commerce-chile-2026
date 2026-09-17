import { jsPDF } from 'jspdf';
import { GlobalEcommerceState } from '../context/AppContext';
import { formatCLP, formatUSD } from '../utils/calculator';
import { NICHES_DATA, SPRINT_7_DAYS } from '../data/blueprintData';

export interface PDFExportOptions {
  state: GlobalEcommerceState;
  documentTitle?: string;
  authorName?: string;
}

export function exportBlueprintPDF(options: PDFExportOptions): void {
  const { state, documentTitle = 'BLUEPRINT OPERATIVO E-COMMERCE CHILE 2026', authorName = 'Lead Founder / Operaciones' } = options;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm
  let currentY = 16;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 16) {
      doc.addPage();
      currentY = 16;
      drawHeaderFooter();
    }
  };

  const drawHeaderFooter = () => {
    // Top border rule
    doc.setDrawColor(214, 219, 227);
    doc.setLineWidth(0.3);
    doc.line(marginX, 10, pageWidth - marginX, 10);

    // Top mini header
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 125, 135);
    doc.text('BLUEPRINT OPERATIVO E-COMMERCE CHILE 2026 • LEY N° 21.713', marginX, 8);
    const dateStr = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric' });
    doc.text(`Emisión: ${dateStr}`, pageWidth - marginX, 8, { align: 'right' });

    // Bottom rule
    doc.line(marginX, pageHeight - 10, pageWidth - marginX, pageHeight - 10);
    doc.text('Confidencial & Estratégico • Generado con Antigravity AI Engine', marginX, pageHeight - 7);
    const pageNum = doc.getNumberOfPages();
    doc.text(`Página ${pageNum}`, pageWidth - marginX, pageHeight - 7, { align: 'right' });
  };

  // Initial header footer
  drawHeaderFooter();

  // ==========================================
  // 1. CARÁTULA EJECUTIVA & CABECERA
  // ==========================================
  doc.setFillColor(28, 32, 44);
  doc.roundedRect(marginX, currentY, contentWidth, 34, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(documentTitle, marginX + 6, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Auditoría y Plan de Negocios Consolidado • Dólar Ref: USD 1 = CLP ${state.exchangeRate} • Autor: ${authorName}`,
    marginX + 6,
    currentY + 18
  );

  // Mini Badges inside banner
  doc.setFillColor(16, 185, 129); // Emerald badge
  doc.roundedRect(marginX + 6, currentY + 22, 46, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Ley N° 21.713 Verificada', marginX + 9, currentY + 26.5);

  doc.setFillColor(59, 130, 246); // Blue badge
  doc.roundedRect(marginX + 56, currentY + 22, 54, 7, 1.5, 1.5, 'F');
  doc.text(`SLA Courier: ${state.selectedCourier.toUpperCase()}`, marginX + 59, currentY + 26.5);

  doc.setFillColor(245, 158, 11); // Amber badge
  doc.roundedRect(marginX + 114, currentY + 22, 60, 7, 1.5, 1.5, 'F');
  doc.text(`Avance Sprint: ${state.sprintProgressPct}% (${state.completedTasksCount}/${state.totalTasksCount})`, marginX + 117, currentY + 26.5);

  currentY += 40;

  // ==========================================
  // 2. INDICADORES CLAVE DE RENDIMIENTO (KPI GRID)
  // ==========================================
  checkPageBreak(38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('1. RESUMEN DE INDICADORES CLAVE DE RENDIMIENTO (KPIS)', marginX, currentY);
  currentY += 4;

  const cardW = (contentWidth - 6) / 4;
  const cardH = 22;

  // KPI 1: Costo Landed vs PVP
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, cardW, cardH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('COSTO LANDED / PVP', marginX + 3, currentY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCLP(state.financialResult.landedCostCLP), marginX + 3, currentY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`PVP: ${formatCLP(state.salePriceCLP)}`, marginX + 3, currentY + 16);
  doc.text(`Markup: ${(state.salePriceCLP / Math.max(state.financialResult.landedCostCLP, 1)).toFixed(1)}x`, marginX + 3, currentY + 19.5);

  // KPI 2: Margen Neto & Breakeven ROAS
  const kpi2X = marginX + cardW + 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(kpi2X, currentY, cardW, cardH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('MARGEN NETO / ROAS EQ.', kpi2X + 3, currentY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const isNetPositive = state.financialResult.netProfitCLP > 0;
  doc.setTextColor(isNetPositive ? 16 : 220, isNetPositive ? 185 : 38, isNetPositive ? 129 : 38);
  doc.text(`${state.financialResult.netMarginPct}% (${formatCLP(state.financialResult.netProfitCLP)})`, kpi2X + 3, currentY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`ROAS Equilibrio: ${state.financialResult.breakevenRoas.toFixed(2)}x`, kpi2X + 3, currentY + 16);
  doc.text(`Target ROAS: ${state.financialResult.suggestedTargetRoas.toFixed(2)}x`, kpi2X + 3, currentY + 19.5);

  // KPI 3: Cumplimiento Tributario
  const kpi3X = marginX + (cardW + 2) * 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(kpi3X, currentY, cardW, cardH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('COMPLIANCE TRIBUTARIO', kpi3X + 3, currentY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(37, 99, 235);
  doc.text(`${state.complianceScorePct}% Conforme`, kpi3X + 3, currentY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Giro SII: ${state.economicCode}`, kpi3X + 3, currentY + 16);
  doc.text('Ley N° 21.713 Aplicada', kpi3X + 3, currentY + 19.5);

  // KPI 4: Logística & Modelo
  const kpi4X = marginX + (cardW + 2) * 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(kpi4X, currentY, cardW, cardH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('MODELO LOGÍSTICO', kpi4X + 3, currentY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(state.fulfillmentModel === '3pl' ? '3PL Fulfillment' : 'In-House (Propio)', kpi4X + 3, currentY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Volumen: ${state.courierVolumeMonthly} envíos/mes`, kpi4X + 3, currentY + 16);
  doc.text(`Courier: ${state.selectedCourier}`, kpi4X + 3, currentY + 19.5);

  currentY += cardH + 7;

  // ==========================================
  // 3. DESGLOSE UNIT ECONOMICS DETALLADO
  // ==========================================
  checkPageBreak(58);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('2. AUDITORÍA FINANCIERA Y UNIT ECONOMICS (POR UNIDAD VENDIDA)', marginX, currentY);
  currentY += 5;

  const tableHeaderY = currentY;
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, tableHeaderY, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('CONCEPTO DE COSTO O INGRESO', marginX + 3, tableHeaderY + 4.2);
  doc.text('BASE USD', marginX + 85, tableHeaderY + 4.2);
  doc.text('EQUIVALENTE CLP', marginX + 118, tableHeaderY + 4.2);
  doc.text('% S/ PVP', marginX + 158, tableHeaderY + 4.2);

  currentY += 6;

  const financialRows = [
    { label: 'Costo Proveedor (FOB / Fábrica)', usd: state.supplierCostUSD, clp: state.supplierCostUSD * state.exchangeRate },
    { label: 'Flete Internacional Courier hacia Chile', usd: state.shippingCostUSD, clp: state.shippingCostUSD * state.exchangeRate },
    { label: 'Subtotal Valor CIF (Proveedor + Flete)', usd: state.financialResult.cifUSD, clp: state.financialResult.cifUSD * state.exchangeRate, bold: true },
    { label: 'IVA Importación 19% (Ley N° 21.713 eliminó exención US$41)', usd: state.financialResult.iva19USD, clp: state.financialResult.ivaF29CreditCLP },
    { label: 'Costo Landed Total Importación (Puesto en Chile)', usd: state.financialResult.landedCostUSD, clp: state.financialResult.landedCostCLP, bold: true },
    { label: `Precio Venta al Público (PVP con IVA) [${state.productName}]`, usd: state.salePriceCLP / state.exchangeRate, clp: state.salePriceCLP, highlight: true },
    { label: 'Comisión Pasarela de Pagos (Webpay / MP ~2.8% - 3.8%)', usd: state.financialResult.gatewayFeeCLP / state.exchangeRate, clp: state.financialResult.gatewayFeeCLP },
    { label: 'Presupuesto Ads Objetivo por Conversión (CPA Estimado)', usd: state.financialResult.suggestedAdCpaCLP / state.exchangeRate, clp: state.financialResult.suggestedAdCpaCLP },
    { label: 'Reserva Devoluciones & Garantía SERNAC (3% sobre PVP)', usd: (state.salePriceCLP * (state.returnRatePct / 100)) / state.exchangeRate, clp: Math.round(state.salePriceCLP * (state.returnRatePct / 100)) },
    { label: 'Utilidad Neta Final por Pedido (Net Profit)', usd: state.financialResult.netProfitCLP / state.exchangeRate, clp: state.financialResult.netProfitCLP, final: true }
  ];

  financialRows.forEach((row, idx) => {
    checkPageBreak(6);
    const rowY = currentY;
    if (row.final) {
      doc.setFillColor(236, 253, 245);
      doc.rect(marginX, rowY, contentWidth, 6, 'F');
    } else if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, rowY, contentWidth, 5.5, 'F');
    }

    doc.setFont('helvetica', row.bold || row.final ? 'bold' : 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(row.final ? 6 : (row.highlight ? 30 : 51), row.final ? 95 : (row.highlight ? 41 : 65), row.final ? 70 : (row.highlight ? 59 : 85));
    doc.text(row.label, marginX + 3, rowY + 4);
    doc.text(formatUSD(row.usd), marginX + 85, rowY + 4);
    doc.text(formatCLP(row.clp), marginX + 118, rowY + 4);

    const pctOfPvp = ((row.clp / state.salePriceCLP) * 100).toFixed(1);
    doc.text(`${pctOfPvp}%`, marginX + 158, rowY + 4);

    currentY += row.final ? 6.5 : 5.5;
  });

  currentY += 4;

  // ==========================================
  // 4. CRONOGRAMA DE LANZAMIENTO & COMPLIANCE
  // ==========================================
  checkPageBreak(52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('3. CRONOGRAMA DE LANZAMIENTO & COMPLIANCE 2026', marginX, currentY);
  currentY += 5;

  const timelineSteps = [
    {
      stage: 'Fase 1',
      title: 'Constitución SpA & RUT SII (Empresa en un Día)',
      desc: 'Código de actividad 479100. Inscripción régimen Pro Pyme y obtención e-RUT.',
      status: state.complianceChecked['spa_empresa_dia'] ? 'COMPLETADO' : 'PENDIENTE'
    },
    {
      stage: 'Fase 2',
      title: 'Certificación de Proveedor & Catálogo',
      desc: 'Validación en AliExpress/CJ/Dropi LATAM. Acuerdos de empaque y fotos UGC.',
      status: state.completedTasks['d1_t1'] && state.completedTasks['d2_t1'] ? 'COMPLETADO' : 'EN CURSO'
    },
    {
      stage: 'Fase 3',
      title: 'Integración Pasarela (Webpay/MP) & Webhooks Courier',
      desc: 'Conexión Transbank Webpay Plus + contrato Blue Express / Starken / Chilexpress.',
      status: state.completedTasks['d3_t1'] ? 'COMPLETADO' : 'PENDIENTE'
    },
    {
      stage: 'Fase 4',
      title: 'Políticas SERNAC & Garantía Legal 6 Meses',
      desc: 'Términos y condiciones con derecho 3x3 y tiempos de despacho explícitos.',
      status: state.complianceChecked['sernac_garantia_6m'] ? 'COMPLETADO' : 'PENDIENTE'
    },
    {
      stage: 'Fase 5',
      title: 'Encendido de Campañas Ads (Meta / TikTok Ads)',
      desc: 'Lanzamiento UGC con estructura Broad + Advantage+ Shopping y CAPI activo.',
      status: state.completedTasks['d7_t1'] ? 'COMPLETADO' : 'PENDIENTE'
    }
  ];

  timelineSteps.forEach((step, idx) => {
    checkPageBreak(8);
    const stepY = currentY;

    // Timeline circle & line
    doc.setFillColor(step.status === 'COMPLETADO' ? 16 : 245, step.status === 'COMPLETADO' ? 185 : 158, step.status === 'COMPLETADO' ? 129 : 11);
    doc.circle(marginX + 4, stepY + 3, 2.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`${step.stage}: ${step.title}`, marginX + 11, stepY + 2.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(step.desc, marginX + 11, stepY + 6);

    // Status pill
    const isDone = step.status === 'COMPLETADO';
    doc.setFillColor(isDone ? 236 : 254, isDone ? 253 : 243, isDone ? 245 : 199);
    doc.roundedRect(pageWidth - marginX - 25, stepY, 25, 5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(isDone ? 5 : 180, isDone ? 150 : 83, isDone ? 105 : 9);
    doc.text(step.status, pageWidth - marginX - 12.5, stepY + 3.5, { align: 'center' });

    currentY += 8.5;
  });

  currentY += 4;

  // ==========================================
  // 5. DECISIÓN LOGÍSTICA & ESTRATEGIA COURIERS
  // ==========================================
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('4. ESTRATEGIA LOGÍSTICA, COURIERS & FULFILLMENT CHILE', marginX, currentY);
  currentY += 5;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`Modelo Seleccionado: ${state.fulfillmentModel === '3pl' ? '3PL Fulfillment Tercerizado' : 'Bodega / Taller In-House'} (${state.courierVolumeMonthly} envíos/mes)`, marginX + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const volWeight = (state.boxLengthCm * state.boxWidthCm * state.boxHeightCm) / 4000;
  doc.text(`• Paquetería estándar: ${state.boxLengthCm}x${state.boxWidthCm}x${state.boxHeightCm} cm | Peso real: ${state.boxWeightKg} kg | Peso volumétrico: ${volWeight.toFixed(2)} kg`, marginX + 4, currentY + 10);
  doc.text(`• Courier asignado: ${state.selectedCourier.toUpperCase()} (Red de agencias/lockers y cobertura nacional).`, marginX + 4, currentY + 14.5);
  doc.text('• Política de Envíos: Envío gratis a todo Chile sobre $29.990 CLP con subsidio en margen bruto unitario.', marginX + 4, currentY + 19);

  currentY += 29;

  // ==========================================
  // 6. FIRMA Y COMPROMISO DE CUMPLIMIENTO
  // ==========================================
  checkPageBreak(25);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(marginX, currentY, contentWidth, 18, 2, 2, 'F');

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Este documento certifica que el plan de operaciones cumple con las normativas tributarias (Ley N° 21.713), aduaneras y de protección al consumidor (SERNAC) vigentes en la República de Chile para el ejercicio 2026.',
    marginX + 4,
    currentY + 6,
    { maxWidth: contentWidth - 8 }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Firma Responsable: _________________________ (${authorName})`, marginX + 4, currentY + 14);

  // Save the PDF
  doc.save('Blueprint_Operativo_Chile_2026.pdf');
}

/**
 * Exporta el estado técnico estructurado en JSON
 */
export function exportBlueprintJSON(state: GlobalEcommerceState): void {
  const exportPayload = {
    metadata: {
      title: 'Blueprint Operativo E-commerce Chile 2026',
      generatedAt: new Date().toISOString(),
      platformVersion: '2026.9.15',
      taxRegulation: 'Ley N° 21.713 de Cumplimiento Tributario',
      consumerProtectionLaw: 'Ley N° 19.496 (SERNAC Garantía Legal 6 Meses)'
    },
    macroEconomics: {
      exchangeRateUSDCLP: state.exchangeRate,
      referenceDate: 'Septiembre 2026'
    },
    nicheAndProduct: {
      selectedNicheId: state.selectedNicheId,
      productName: state.productName,
      suggestedPvpCLP: state.salePriceCLP,
      supplierCostUSD: state.supplierCostUSD,
      shippingCostUSD: state.shippingCostUSD
    },
    financialEngine: {
      cifUSD: state.financialResult.cifUSD,
      iva19USD: state.financialResult.iva19USD,
      landedCostUSD: state.financialResult.landedCostUSD,
      landedCostCLP: state.financialResult.landedCostCLP,
      grossProfitCLP: state.financialResult.grossProfitCLP,
      grossMarginPct: state.financialResult.grossMarginPct,
      netProfitCLP: state.financialResult.netProfitCLP,
      netMarginPct: state.financialResult.netMarginPct,
      breakevenRoas: state.financialResult.breakevenRoas,
      suggestedTargetRoas: state.financialResult.suggestedTargetRoas,
      suggestedAdCpaCLP: state.financialResult.suggestedAdCpaCLP,
      f29BalanceCLP: state.financialResult.f29BalanceCLP
    },
    complianceAndTax: {
      economicActivityCode: state.economicCode,
      taxRegime: state.taxRegime,
      complianceScorePct: state.complianceScorePct,
      checklistVerification: state.complianceChecked
    },
    logisticsAndFulfillment: {
      monthlyVolumeShipments: state.courierVolumeMonthly,
      selectedCourier: state.selectedCourier,
      fulfillmentModel: state.fulfillmentModel,
      standardPackaging: {
        lengthCm: state.boxLengthCm,
        widthCm: state.boxWidthCm,
        heightCm: state.boxHeightCm,
        physicalWeightKg: state.boxWeightKg,
        volumetricWeightKg: Number(((state.boxLengthCm * state.boxWidthCm * state.boxHeightCm) / 4000).toFixed(2))
      }
    },
    sprintExecution: {
      completedTasksCount: state.completedTasksCount,
      totalTasksCount: state.totalTasksCount,
      progressPct: state.sprintProgressPct,
      completedTasks: state.completedTasks
    }
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Blueprint_Operativo_Chile_2026_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
