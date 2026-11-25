import ejs from 'ejs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve(__filename, '..');

const fmt = (n: number | null | undefined): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
};

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatFullDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function parsePercent(val: any): number {
  if (val === null || val === undefined) return 0;
  const str = String(val).replace('%', '').trim().replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.min(100, Math.max(0, num));
}

export class ReportsService {
  /**
   * Genera el SVG vectorial para la gráfica ejecutiva de avance físico (Curva S / Progreso)
   */
  generateProgressChartSvg(chartData: Array<{ name: string; dateLabel: string; avanceProyectado: number; avanceReal: number | null }>): string {
    if (!chartData || chartData.length === 0) return '';

    const width = 740;
    const height = 230;
    const pad = { top: 25, right: 25, bottom: 42, left: 45 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    const toY = (val: number) => pad.top + chartH - (val / 100) * chartH;

    // Líneas guía horizontales
    const yTicks = [0, 25, 50, 75, 100];
    let gridSvg = '';
    yTicks.forEach((tick) => {
      const y = toY(tick);
      gridSvg += `
        <line x1="${pad.left}" y1="${y}" x2="${pad.left + chartW}" y2="${y}" stroke="#e5ded3" stroke-width="1" stroke-dasharray="3,3" />
        <text x="${pad.left - 8}" y="${y + 3.5}" text-anchor="end" fill="#6b7280" font-family="-apple-system, sans-serif" font-size="9" font-weight="600">${tick}%</text>
      `;
    });

    const count = chartData.length;
    const getX = (idx: number) => {
      if (count <= 1) return pad.left + chartW / 2;
      return pad.left + (idx / (count - 1)) * chartW;
    };

    // Coordenadas avance proyectado
    const projPoints: Array<{ x: number; y: number }> = [];
    // Coordenadas avance real (solo puntos válidos)
    const realPoints: Array<{ x: number; y: number }> = [];

    let xLabelsSvg = '';

    chartData.forEach((d, idx) => {
      const x = getX(idx);
      const projY = toY(d.avanceProyectado);
      projPoints.push({ x, y: projY });

      if (d.avanceReal !== null && d.avanceReal !== undefined) {
        const realY = toY(d.avanceReal);
        realPoints.push({ x, y: realY });
      }

      xLabelsSvg += `
        <text x="${x}" y="${pad.top + chartH + 16}" text-anchor="middle" fill="#4e5558" font-family="-apple-system, sans-serif" font-size="9" font-weight="700">${d.name}</text>
        <text x="${x}" y="${pad.top + chartH + 28}" text-anchor="middle" fill="#8d918f" font-family="-apple-system, sans-serif" font-size="7.5" font-weight="500">${d.dateLabel}</text>
      `;
    });

    // Curva proyectada (Naranja #d9772f)
    let projPathD = '';
    if (projPoints.length > 0 && projPoints[0]) {
      projPathD = `M ${projPoints[0].x} ${projPoints[0].y}`;
      for (let i = 1; i < projPoints.length; i++) {
        const pt = projPoints[i];
        if (pt) projPathD += ` L ${pt.x} ${pt.y}`;
      }
    }
    const lastProj = projPoints[projPoints.length - 1];
    const firstProj = projPoints[0];
    const projAreaD = (projPoints.length > 0 && lastProj && firstProj)
      ? `${projPathD} L ${lastProj.x} ${pad.top + chartH} L ${firstProj.x} ${pad.top + chartH} Z`
      : '';

    // Curva real ejecutada (Verde #236343)
    let realPathD = '';
    if (realPoints.length > 0 && realPoints[0]) {
      realPathD = `M ${realPoints[0].x} ${realPoints[0].y}`;
      for (let i = 1; i < realPoints.length; i++) {
        const pt = realPoints[i];
        if (pt) realPathD += ` L ${pt.x} ${pt.y}`;
      }
    }
    const lastReal = realPoints[realPoints.length - 1];
    const firstReal = realPoints[0];
    const realAreaD = (realPoints.length > 0 && lastReal && firstReal)
      ? `${realPathD} L ${lastReal.x} ${pad.top + chartH} L ${firstReal.x} ${pad.top + chartH} Z`
      : '';

    // Puntos (Círculos)
    let dotsSvg = '';
    projPoints.forEach((p) => {
      dotsSvg += `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#d9772f" stroke="#ffffff" stroke-width="1.5" />`;
    });
    realPoints.forEach((p) => {
      dotsSvg += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#236343" stroke="#ffffff" stroke-width="1.5" />`;
    });

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="auto">
        <defs>
          <linearGradient id="gradProyectado" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#d9772f" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#d9772f" stop-opacity="0.0" />
          </linearGradient>
          <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#236343" stop-opacity="0.28" />
            <stop offset="100%" stop-color="#236343" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <!-- Ejes y grilla -->
        ${gridSvg}
        <line x1="${pad.left}" y1="${pad.top + chartH}" x2="${pad.left + chartW}" y2="${pad.top + chartH}" stroke="#d8d0c4" stroke-width="1" />

        <!-- Área y línea proyectada -->
        ${projAreaD ? `<path d="${projAreaD}" fill="url(#gradProyectado)" />` : ''}
        ${projPathD ? `<path d="${projPathD}" fill="none" stroke="#d9772f" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />` : ''}

        <!-- Área y línea real -->
        ${realAreaD ? `<path d="${realAreaD}" fill="url(#gradReal)" />` : ''}
        ${realPathD ? `<path d="${realPathD}" fill="none" stroke="#236343" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />` : ''}

        <!-- Puntos -->
        ${dotsSvg}

        <!-- Etiquetas X -->
        ${xLabelsSvg}
      </svg>
    `;

    return svg;
  }

  /**
   * Genera el PDF del Reporte Oficial de Avance Físico del Proyecto
   */
  async generateProjectProgressPdf(data: any): Promise<Buffer> {
    const project = data.project || {};
    const progressList = data.progressList || [];

    // Normalizar historial
    const normalizedReports = (progressList || [])
      .map((p: any) => {
        const rawDate = p.date || p.endDate || p.startDate || p.createdAt;
        const d = rawDate ? new Date(rawDate) : null;
        return {
          id: p.id,
          date: d,
          formattedDate: formatDate(d),
          periodLabel: (p.startDate && p.endDate)
            ? `${formatDate(p.startDate)} al ${formatDate(p.endDate)}`
            : 'Corte periódico',
          actual: parsePercent(p.actualProgress),
          planned: parsePercent(p.plannedProgress),
          attentionPoints: p.attentionPoints || 'Sin observaciones',
        };
      })
      .filter((r: any) => r.date !== null && !isNaN(r.date.getTime()))
      .sort((a: any, b: any) => a.date.getTime() - b.date.getTime());

    const latestReport = normalizedReports.length > 0
      ? normalizedReports[normalizedReports.length - 1]
      : null;

    const actualPercent = latestReport?.actual ?? parsePercent(
      project.lastProgress?.actualProgress ?? project.actualPhysicalProgress
    );

    const plannedPercent = latestReport?.planned ?? parsePercent(
      project.lastProgress?.plannedProgress ?? project.plannedPhysicalProgress
    );

    // Preparar chartData si no viene provisto
    let chartData = data.chartData;
    if (!chartData || chartData.length === 0) {
      chartData = [];
      if (project.startDate) {
        const pStart = new Date(project.startDate);
        if (!isNaN(pStart.getTime())) {
          chartData.push({
            name: 'Inicio',
            dateLabel: formatDate(pStart),
            avanceProyectado: 0,
            avanceReal: 0,
          });
        }
      }
      normalizedReports.forEach((rep: any, idx: number) => {
        chartData.push({
          name: `Corte ${idx + 1}`,
          dateLabel: rep.date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
          avanceProyectado: rep.planned,
          avanceReal: rep.actual,
        });
      });
      if (project.endDate) {
        const pEnd = new Date(project.endDate);
        if (!isNaN(pEnd.getTime())) {
          chartData.push({
            name: 'Culminación',
            dateLabel: formatDate(pEnd),
            avanceProyectado: 100,
            avanceReal: null,
          });
        }
      }
    }

    const chartSvg = this.generateProgressChartSvg(chartData);

    const emissionDateStr = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const statusMap: Record<string, { label: string; class: string }> = {
      IN_PROGRESS: { label: 'En Ejecución', class: 'status-in-progress' },
      COMPLETED: { label: 'Completado', class: 'status-completed' },
      PAUSED: { label: 'Pausado', class: 'status-paused' },
      PLANNING: { label: 'Planificación', class: 'status-planning' },
    };
    const statusConfig = statusMap[project.status] || { label: project.status || 'Activo', class: 'status-in-progress' };

    const managerName = (project.manager?.managerName || project.manager?.name || 'No asignado').trim();
    const companyName = project.company?.legalName || project.company?.name || 'Sin empresa asignada';
    const attentionPoints = latestReport?.attentionPoints || project.lastProgress?.attentionPoints || 'Sin observaciones registradas para este período.';

    const templatePath = path.resolve(__dirname, '..', 'templates', 'project-progress.ejs');

    const html = await ejs.renderFile(templatePath, {
      project,
      statusLabel: statusConfig.label,
      statusClass: statusConfig.class,
      companyName,
      managerName,
      startDateStr: formatFullDate(project.startDate),
      endDateStr: formatFullDate(project.endDate),
      emissionDateStr,
      latestReport,
      latestReportDateStr: latestReport ? formatDate(latestReport.date) : '',
      actualPercent,
      plannedPercent,
      attentionPoints,
      chartSvg,
      normalizedReports,
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' as any, timeout: 30_000 });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="font-size: 8pt; width: 100%; display: flex; justify-content: space-between; padding: 0 28px; color: #8d918f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <span>Certificación de avance físico</span>
            <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
          </div>
        `,
        margin: {
          top: '20mm',
          bottom: '22mm',
          left: '15mm',
          right: '15mm',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  /**
   * Genera el PDF del Reporte Financiero de Pagos y Cuentas por Pagar
   */
  async generateFinancialReportPdf(data: any): Promise<Buffer> {
    const isProjectMode = Boolean(data.isProjectMode);
    const project = data.project || null;
    const projectSnapshot = data.projectSnapshot || null;
    const globalData = data.globalData || null;

    let summary = data.summary;
    if (!summary) {
      if (isProjectMode && projectSnapshot) {
        const snap = projectSnapshot.summary || {};
        const totalDebt = snap.totalDebt || 0;
        const totalPaid = snap.totalPaid || 0;
        const totalPending = snap.totalPending || 0;
        summary = {
          totalDebt,
          totalPaid,
          totalPending,
          paidPct: totalDebt > 0 ? Math.round((totalPaid / totalDebt) * 100) : 0,
          pendingPct: totalDebt > 0 ? Math.round((totalPending / totalDebt) * 100) : 0,
          advancePayment: Number(projectSnapshot.advancePaymentUsd || 0),
          pendingAdvance: Number(projectSnapshot.pendingAdvanceUsd || 0),
          totalItems: (projectSnapshot.items || []).length,
        };
      } else if (globalData) {
        const g = globalData.globalSummary || {};
        const totalDebt = g.totalDebt || 0;
        const totalPaid = g.totalPaid || 0;
        const totalPending = g.totalPending || 0;
        summary = {
          totalDebt,
          totalPaid,
          totalPending,
          paidPct: totalDebt > 0 ? Math.round((totalPaid / totalDebt) * 100) : 0,
          pendingPct: totalDebt > 0 ? Math.round((totalPending / totalDebt) * 100) : 0,
          advancePayment: 0,
          pendingAdvance: 0,
          totalItems: (globalData.projects || []).length,
        };
      } else {
        summary = {
          totalDebt: 0,
          totalPaid: 0,
          totalPending: 0,
          paidPct: 0,
          pendingPct: 0,
          advancePayment: 0,
          pendingAdvance: 0,
          totalItems: 0,
        };
      }
    }

    const emissionDateStr = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const items = projectSnapshot?.items || [];
    const projects = globalData?.projects || [];
    const totalProjectsCount = globalData?.globalSummary?.totalProjects || projects.length;
    const companyName = project?.company?.legalName || project?.company?.name || 'Sin empresa';

    const templatePath = path.resolve(__dirname, '..', 'templates', 'financial-report.ejs');

    const html = await ejs.renderFile(templatePath, {
      isProjectMode,
      project,
      summary,
      items,
      projects,
      totalProjectsCount,
      companyName,
      emissionDateStr,
      fmt,
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' as any, timeout: 30_000 });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="font-size: 8pt; width: 100%; display: flex; justify-content: space-between; padding: 0 28px; color: #8d918f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <span>Registros conciliados con módulo bancario y proveedores</span>
            <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
          </div>
        `,
        margin: {
          top: '20mm',
          bottom: '22mm',
          left: '15mm',
          right: '15mm',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}
