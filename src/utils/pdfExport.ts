import { jsPDF } from 'jspdf';
import { SPRINT_7_DAYS, NICHES_DATA } from '../data/blueprintData';
import { formatCLP, formatUSD } from './calculator';
import { LandedCostResult } from '../types/blueprint';

export interface BusinessPlanExportOptions {
  exchangeRate: number;
  completedTasks: { [taskId: string]: boolean };
  financialData?: {
    productName?: string;
    supplierCostUSD: number;
    shippingCostUSD: number;
    salePriceCLP: number;
    gatewayType: string;
    gatewayName?: string;
    customAdCpa?: number;
    returnRatePct?: number;
    landedResult: LandedCostResult;
  };
  exportScope?: 'complete' | 'financial_only' | 'sprint_only';
  documentTitle?: string;
}

export function generateBusinessPlanPDF(options: BusinessPlanExportOptions): void {
  const {
    exchangeRate,
    completedTasks,
    financialData,
    exportScope = 'complete'
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  let currentY = 14;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 16) {
      doc.addPage();
      currentY = 16;
      drawPageDecorations();
    }
  };

  const drawPageDecorations = () => {
    // Subtle top rule
    doc.setDrawColor(220, 224, 230);
    doc.setLineWidth(0.3);
    doc.line(marginX, 10, pageWidth - marginX, 10);

    // Subtle header text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 145, 155);
    doc.text('PLAN DE NEGOCIOS & ROADMAP OPERATIVO — CHILE 2026', marginX, 8);
    doc.text('CONFIDENCIAL', pageWidth - marginX, 8, { align: 'right' });

    // Subtle footer rule
    doc.line(marginX, pageHeight - 10, pageWidth - marginX, pageHeight - 10);
    doc.text('Cumplimiento Ley N° 21.713 & Ley N° 19.496 SERNAC • Blueprint E-Commerce', marginX, pageHeight - 6.5);
    const pageNumber = doc.getNumberOfPages();
    doc.text(`Página ${pageNumber}`, pageWidth - marginX, pageHeight - 6.5, { align: 'right' });
  };

  // ----------------------------------------------------
  // COVER / EXECUTIVE HEADER
  // ----------------------------------------------------
  drawPageDecorations();

  // Dark Header Banner
  doc.setFillColor(28, 25, 23); // stone-900
  doc.roundedRect(marginX, currentY, contentWidth, 32, 2.5, 2.5, 'F');

  // Badge inside banner
  doc.setFillColor(245, 158, 11); // amber-500
  doc.roundedRect(marginX + 6, currentY + 5, 48, 5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(28, 25, 23);
  doc.text('CHILE & LATAM • VERSIÓN 2026', marginX + 8, currentY + 8.5);

  // Main Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('PLAN DE NEGOCIOS & ROADMAP OPERATIVO', marginX + 6, currentY + 17);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(214, 211, 209); // stone-300
  doc.text('E-Commerce Transfronterizo & Dropshipping: Sprint Táctico + Simulación Financiera Landed', marginX + 6, currentY + 23);

  // Date & Exchange Rate Tag
  const todayStr = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.setFontSize(7.5);
  doc.setTextColor(168, 162, 158); // stone-400
  doc.text(`Fecha: ${todayStr}  |  Dólar Observado: 1 USD ≈ $${exchangeRate} CLP  |  Normativa SII: 19% IVA`, marginX + 6, currentY + 28.5);

  currentY += 36;

  // ----------------------------------------------------
  // EXECUTIVE SUMMARY BADGES (GRID OF 4 METRICS)
  // ----------------------------------------------------
  const allTaskIds = SPRINT_7_DAYS.flatMap(d => d.tasks.map(t => t.id));
  const totalSprintTasks = allTaskIds.length;
  const completedSprintCount = allTaskIds.filter(id => completedTasks[id]).length;
  const sprintPct = Math.round((completedSprintCount / totalSprintTasks) * 100);

  const cardWidth = (contentWidth - 6) / 3;
  const cardHeight = 15;

  // Card 1: Sprint Progress
  doc.setFillColor(245, 245, 244); // stone-100
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(marginX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(110, 115, 125);
  doc.text('PROGRESO SPRINT 7 DÍAS', marginX + 4, currentY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(`${sprintPct}% Completado`, marginX + 4, currentY + 9.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(120, 125, 135);
  doc.text(`${completedSprintCount} de ${totalSprintTasks} hitos validados`, marginX + 4, currentY + 13);

  // Card 2: Regulatory Baseline
  const card2X = marginX + cardWidth + 3;
  doc.setFillColor(245, 245, 244);
  doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(110, 115, 125);
  doc.text('MARCO TRIBUTARIO (SII)', card2X + 4, currentY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(28, 25, 23);
  doc.text('Ley N° 21.713 (19% IVA)', card2X + 4, currentY + 9.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(120, 125, 135);
  doc.text('Fin exención USD 41 • DTE 39', card2X + 4, currentY + 13);

  // Card 3: Financial Baseline
  const card3X = card2X + cardWidth + 3;
  doc.setFillColor(245, 245, 244);
  doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(110, 115, 125);
  doc.text('PASARELA DE PAGO LOCAL', card3X + 4, currentY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(28, 25, 23);
  doc.text('Webpay Plus / Transbank', card3X + 4, currentY + 9.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(120, 125, 135);
  doc.text('Redcompra + Cuotas en CLP', card3X + 4, currentY + 13);

  currentY += cardHeight + 5;

  // ----------------------------------------------------
  // SECTION 1: FINANCIAL SUMMARY & UNIT ECONOMICS
  // ----------------------------------------------------
  if (exportScope === 'complete' || exportScope === 'financial_only') {
    checkPageBreak(75);

    // Section title
    doc.setFillColor(245, 245, 244);
    doc.rect(marginX, currentY, contentWidth, 7, 'F');
    doc.setFillColor(245, 158, 11);
    doc.rect(marginX, currentY, 2.5, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(28, 25, 23);
    doc.text('1. RESUMEN FINANCIERO & MODELADO UNIT ECONOMICS 2026', marginX + 6, currentY + 4.8);

    currentY += 10;

    // Use passed financial data or fallback to defaults
    const fin = financialData || {
      productName: 'Cepillo de Vapor Mascotas 3 en 1',
      supplierCostUSD: 11,
      shippingCostUSD: 5,
      salePriceCLP: 32990,
      gatewayType: 'webpay_credit',
      gatewayName: 'Webpay Plus Crédito (2.35%+IVA)',
      customAdCpa: 0,
      returnRatePct: 3,
      landedResult: {
        cifUSD: 16,
        iva19USD: 3.04,
        landedCostUSD: 19.04,
        landedCostCLP: 17898,
        salePriceCLP: 32990,
        grossProfitCLP: 15092,
        grossMarginPct: 45.75,
        gatewayFeePct: 2.80,
        gatewayFeeCLP: 924,
        breakevenRoas: 2.19,
        suggestedTargetRoas: 2.73,
        suggestedAdCpaCLP: 12084,
        netProfitCLP: 2084,
        netMarginPct: 6.32,
        ivaF29CreditCLP: 2858,
        ivaF29DebitCLP: 5267,
        f29BalanceCLP: 2409
      }
    };

    const res = fin.landedResult;

    // Financial detail box
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(marginX, currentY, contentWidth, 54, 1.5, 1.5, 'FD');

    // Product Header Inside Card
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginX, currentY, contentWidth, 8, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(`SKU Simulado: ${fin.productName || 'Producto en Evaluación'}`, marginX + 4, currentY + 5.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`PVP Público: ${formatCLP(fin.salePriceCLP)} | Pasarela: ${fin.gatewayName || 'Webpay Plus'}`, pageWidth - marginX - 4, currentY + 5.2, { align: 'right' });

    // 2-Column financial breakdown table
    const colW = (contentWidth - 8) / 2;
    const startTableY = currentY + 12;

    const leftColRows = [
      { label: 'Costo Fábrica Proveedor (USD):', value: `${formatUSD(fin.supplierCostUSD)} (~${formatCLP(Math.round(fin.supplierCostUSD * exchangeRate))})` },
      { label: 'Flete Internacional DSers/AliExpress:', value: `${formatUSD(fin.shippingCostUSD)} (~${formatCLP(Math.round(fin.shippingCostUSD * exchangeRate))})` },
      { label: 'Subtotal Aduanero CIF (USD):', value: `${formatUSD(res.cifUSD)}` },
      { label: '19% IVA Importación (Ley 21.713):', value: `${formatUSD(res.iva19USD)} (${formatCLP(Math.round(res.iva19USD * exchangeRate))})` },
      { label: 'Costo Landed Total Puesto en Chile:', value: `${formatUSD(res.landedCostUSD)} (${formatCLP(res.landedCostCLP)})`, bold: true }
    ];

    const rightColRows = [
      { label: 'Precio de Venta al Público (PVP):', value: formatCLP(fin.salePriceCLP), bold: true },
      { label: 'Utilidad Bruta por Venta:', value: `${formatCLP(res.grossProfitCLP)} (${res.grossMarginPct.toFixed(1)}%)` },
      { label: 'Comisión Pasarela Transbank/MP:', value: `${formatCLP(res.gatewayFeeCLP)} (${res.gatewayFeePct.toFixed(2)}%)` },
      { label: 'CPA Objetivo Ads (TikTok/Meta):', value: formatCLP(res.suggestedAdCpaCLP) },
      { label: 'ROAS Mínimo Breakeven / Target:', value: `${res.breakevenRoas.toFixed(2)}x / ${res.suggestedTargetRoas.toFixed(2)}x`, bold: true }
    ];

    let rowY = startTableY;
    leftColRows.forEach((r, idx) => {
      doc.setFont('helvetica', r.bold ? 'bold' : 'normal');
      doc.setFontSize(7);
      doc.setTextColor(r.bold ? 15 : 80, r.bold ? 23 : 85, r.bold ? 42 : 95);
      doc.text(r.label, marginX + 4, rowY);
      doc.text(r.value, marginX + colW - 2, rowY, { align: 'right' });
      rowY += 7.2;
    });

    rowY = startTableY;
    rightColRows.forEach((r, idx) => {
      doc.setFont('helvetica', r.bold ? 'bold' : 'normal');
      doc.setFontSize(7);
      doc.setTextColor(r.bold ? 15 : 80, r.bold ? 23 : 85, r.bold ? 42 : 95);
      const col2Left = marginX + colW + 4;
      doc.text(r.label, col2Left, rowY);
      doc.text(r.value, marginX + contentWidth - 4, rowY, { align: 'right' });
      rowY += 7.2;
    });

    currentY += 58;

    // Financial Key Takeaway Note
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(251, 191, 36);
    doc.roundedRect(marginX, currentY, contentWidth, 12, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(146, 64, 14); // amber-800
    doc.text('REGLA DE ORO DE VIABILIDAD ECONÓMICA EN CHILE:', marginX + 3, currentY + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(180, 83, 9);
    doc.text(`Todo producto debe venderse a mínimo 3.0x del costo landed para absorber 19% IVA, pasarela (~2.8%) y costo de tráfico pagado. Breakeven: ${res.breakevenRoas.toFixed(2)}x ROAS.`, marginX + 3, currentY + 8.5);

    currentY += 16;
  }

  // ----------------------------------------------------
  // SECTION 2: SPRINT 7 DÍAS EXECUTION PLAN & TASKS
  // ----------------------------------------------------
  if (exportScope === 'complete' || exportScope === 'sprint_only') {
    checkPageBreak(50);

    // Section title
    doc.setFillColor(245, 245, 244);
    doc.rect(marginX, currentY, contentWidth, 7, 'F');
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(marginX, currentY, 2.5, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(28, 25, 23);
    doc.text(`2. ROADMAP TÁCTICO: SPRINT 7 DÍAS (${completedSprintCount}/${totalSprintTasks} COMPLETADAS - ${sprintPct}%)`, marginX + 6, currentY + 4.8);

    currentY += 10;

    // Iterate through all 7 days of the sprint
    SPRINT_7_DAYS.forEach((dayData) => {
      // Calculate day completion
      const dayTasks = dayData.tasks;
      const dayCompletedCount = dayTasks.filter(t => completedTasks[t.id]).length;
      const dayPct = Math.round((dayCompletedCount / dayTasks.length) * 100);

      // Check space needed for this day block (approx 22-26mm)
      checkPageBreak(26);

      // Day Sub-header
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginX, currentY, contentWidth, 6.5, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`Día ${dayData.day}: ${dayData.title}`, marginX + 3, currentY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Enfoque: ${dayData.subtitle}  |  Est: ${dayData.timeEst}`, marginX + 68, currentY + 4.5);

      // Day status badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      if (dayCompletedCount === dayTasks.length) {
        doc.setTextColor(16, 185, 129); // emerald-600
        doc.text(`[✔ 100% COMPLETADO]`, pageWidth - marginX - 3, currentY + 4.5, { align: 'right' });
      } else {
        doc.setTextColor(217, 119, 6); // amber-600
        doc.text(`[${dayCompletedCount}/${dayTasks.length} Tareas - ${dayPct}%]`, pageWidth - marginX - 3, currentY + 4.5, { align: 'right' });
      }

      currentY += 8.5;

      // Render each task item of the day
      dayTasks.forEach((task) => {
        checkPageBreak(12);

        const isDone = Boolean(completedTasks[task.id]);

        // Draw checkbox symbol
        doc.setDrawColor(isDone ? 16 : 203, isDone ? 185 : 213, isDone ? 129 : 225);
        doc.setFillColor(isDone ? 236 : 255, isDone ? 253 : 255, isDone ? 245 : 255);
        doc.roundedRect(marginX + 2, currentY, 4, 4, 0.8, 0.8, 'FD');

        if (isDone) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(16, 185, 129);
          doc.text('✓', marginX + 2.8, currentY + 3.1);
        }

        // Task Title / text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(isDone ? 15 : 51, isDone ? 23 : 65, isDone ? 42 : 85);
        const titleLines = doc.splitTextToSize(task.text, contentWidth - 36);
        doc.text(titleLines, marginX + 8, currentY + 3.2);

        // Status pill
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.2);
        doc.setTextColor(isDone ? 16 : 148, isDone ? 185 : 163, isDone ? 129 : 184);
        const statusLabel = isDone ? 'COMPLETADA' : 'PENDIENTE';
        doc.text(`[${statusLabel}]`, pageWidth - marginX - 3, currentY + 3.2, { align: 'right' });

        currentY += titleLines.length * 3.5 + 1.2;

        // Detail text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        const detailLines = doc.splitTextToSize(`Detalle: ${task.detail}`, contentWidth - 10);
        doc.text(detailLines, marginX + 8, currentY + 1.5);

        currentY += detailLines.length * 3.2 + 2.5;
      });

      currentY += 2;
    });
  }

  // ----------------------------------------------------
  // SECTION 3: PROTOCOLOS LEGALES & SOPORTE SERNAC
  // ----------------------------------------------------
  checkPageBreak(45);

  doc.setFillColor(245, 245, 244);
  doc.rect(marginX, currentY, contentWidth, 7, 'F');
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.rect(marginX, currentY, 2.5, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(28, 25, 23);
  doc.text('3. MATRIZ DE CUMPLIMIENTO LEGAL, TRIBUTARIO Y ATENCIÓN AL CLIENTE', marginX + 6, currentY + 4.8);

  currentY += 10;

  // 3 Legal Bullet Boxes
  const legalBoxW = (contentWidth - 6) / 3;
  const legalBoxH = 26;

  // Box 1: SII
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(marginX, currentY, legalBoxW, legalBoxH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(28, 25, 23);
  doc.text('Tributario SII & Boletas', marginX + 3, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  const siiText = '• Régimen Pro Pyme 14 D N°3 (12,5%)\n• Emisión Boleta DTE 39 automática\n• Precios con 19% IVA incluido siempre';
  doc.text(siiText, marginX + 3, currentY + 9);

  // Box 2: SERNAC
  const box2X = marginX + legalBoxW + 3;
  doc.roundedRect(box2X, currentY, legalBoxW, legalBoxH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(28, 25, 23);
  doc.text('Garantía Legal SERNAC', box2X + 3, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  const sernacText = '• 6 meses legales (cambio/reparo/devolución)\n• 30 días satisfacción garantizada\n• Sin publicidad engañosa ni countdowns falsos';
  doc.text(sernacText, box2X + 3, currentY + 9);

  // Box 3: Logística
  const box3X = box2X + legalBoxW + 3;
  doc.roundedRect(box3X, currentY, legalBoxW, legalBoxH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(28, 25, 23);
  doc.text('Logística Transfronteriza', box3X + 3, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  const logText = '• AliExpress/DSers: 15-25 días hábiles\n• Dropi Local Express: 24-72h RM/Regiones\n• Código seguimiento Correos/Chilexpress';
  doc.text(logText, box3X + 3, currentY + 9);

  currentY += legalBoxH + 6;

  // Closing Sign-off
  checkPageBreak(12);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(140, 145, 155);
  doc.text('Documento generado automáticamente por la Plataforma de Blueprint E-Commerce Chile 2026.', marginX, currentY);
  doc.text('Válido como plan de trabajo para postulaciones Sercotec, Corfo, rondas ángel o auditoría interna.', marginX, currentY + 3.5);

  // Trigger browser download
  const cleanDate = new Date().toISOString().slice(0, 10);
  const fileName = `Plan_de_Negocios_Ecommerce_Chile_${cleanDate}.pdf`;
  doc.save(fileName);
}
