import ejs from 'ejs';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import ExcelJS from 'exceljs';
import * as repo from '../repositories/executive.repository';
import { ExecutiveError } from '../interfaces/executive.errors';
import { IndicatorsService } from './indicators.service';

/**
 * MÓDULO EJECUTIVO — Exports (PDF / XLSX / JSON).
 *
 * Portado fiel del ExportsService de la fuente. El PDF usa puppeteer
 * directamente (dependencia ya existente del ERP) en lugar de html-pdf-node.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve(__filename, '..');

export interface ExportReportFilters {
  processId?: string;
  startsAt?: string;
  endsAt?: string;
  note?: string;
  chartVariant?: 'LINE' | 'BAR';
  indicatorId?: string;
}

export class ExportsService {
  private readonly indicatorsService = new IndicatorsService();

  private async buildReportWhere(filters: ExportReportFilters) {
    const where: any = {
      version: {
        indicator: {
          organization: { code: 'CORP_MAIN' },
          ...(filters.processId ? { processId: filters.processId } : {}),
        },
      },
    };

    if (filters.startsAt || filters.endsAt) {
      const periodWhere: any = {};
      if (filters.endsAt) {
        periodWhere.startsAt = { lte: new Date(`${filters.endsAt}T23:59:59.999Z`) };
      }
      if (filters.startsAt) {
        periodWhere.endsAt = { gte: new Date(`${filters.startsAt}T00:00:00.000Z`) };
      }
      const matchingPeriods = await repo.findMatchingPeriodIds(periodWhere);
      if (matchingPeriods.length === 0) return null;
      where.periodId = { in: matchingPeriods };
    }

    return where;
  }

  async generateJson(filters: ExportReportFilters = {}) {
    const where = await this.buildReportWhere(filters);
    if (!where) return [];
    const measurements = await repo.findReportMeasurements(where);

    return measurements.map((m) => {
      const inputsStr = m.inputs.map((i) => `${i.key}=${i.value}`).join('; ');
      const target = m.version.targets?.[0]?.targetValue ?? null;
      return {
        indicatorId: m.version.indicator.id,
        process: m.version.indicator.process.name,
        processCode: m.version.indicator.process.code,
        indicator: m.version.indicator.name,
        indicatorCode: m.version.indicator.code,
        frequency: m.version.frequency,
        direction: m.version.direction,
        formula: m.version.formula,
        responsible: m.submittedBy.email,
        target,
        unit: m.version.targets?.[0]?.unit ?? '%',
        value: m.value,
        trafficLight: m.trafficLight,
        inputs: inputsStr,
        rawInputs: m.inputs,
        chartType: m.version.indicator.chartType,
        periodId: m.periodId,
        period: m.period,
        observation: m.observation,
        internalAnalysis: m.analysisInternal,
        actionPlans: m.actionPlans.map((ap) => ({
          action: ap.action,
          dates: ap.dates,
          progress: ap.progress,
          owner: ap.owner.email,
        })),
      };
    });
  }

  // ─── Generadores SVG ─────────────────────────────────────────────────────

  /** Bar chart SVG (variante BAR) — sin dependencias nativas. */
  generateIndicatorChartSvg(measurements: any[], targetValue: number): string {
    const WIDTH = 650;
    const HEIGHT = 260;
    const PAD = { top: 20, right: 20, bottom: 50, left: 50 };
    const CHART_W = WIDTH - PAD.left - PAD.right;
    const CHART_H = HEIGHT - PAD.top - PAD.bottom;

    if (!measurements || measurements.length === 0) {
      return this.svgToDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
          <rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff" rx="4"/>
          <text x="${WIDTH / 2}" y="${HEIGHT / 2}" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="14">Sin datos disponibles</text>
        </svg>`);
    }

    const sorted = [...measurements].sort(
      (a, b) =>
        new Date(a.period?.startsAt || 0).getTime() -
        new Date(b.period?.startsAt || 0).getTime(),
    );

    const labels = sorted.map((m) =>
      m.period?.startsAt
        ? new Date(m.period.startsAt).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
        : 'N/A',
    );

    const values = sorted.map((m) => m.value ?? 0);
    const maxVal = Math.max(...values, targetValue || 0, 1);
    const yMax = Math.ceil(maxVal * 1.15);
    const barCount = values.length;
    const barGap = 12;
    const barWidth = Math.max(6, Math.min(40, (CHART_W - barGap * (barCount + 1)) / barCount));
    const usableW = barCount * barWidth + barGap * (barCount + 1);
    const offsetX = PAD.left + (CHART_W - usableW) / 2;

    const toY = (v: number) => PAD.top + CHART_H - (v / yMax) * CHART_H;

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
      y: PAD.top + CHART_H * (1 - f),
      label: Math.round(yMax * f).toString(),
    }));

    let barsSvg = '';
    let labelsSvg = '';

    values.forEach((v, i) => {
      const x = offsetX + barGap + i * (barWidth + barGap);
      const barH = (v / yMax) * CHART_H;
      const y = toY(v);
      const color = targetValue && v >= targetValue ? '#16a34a' : targetValue && v < targetValue ? '#dc2626' : '#94a3b8';

      barsSvg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" fill="${color}" rx="3" />`;
      labelsSvg += `<text x="${x + barWidth / 2}" y="${PAD.top + CHART_H + 16}" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="10">${labels[i]}</text>`;
      barsSvg += `<text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle" fill="#1e293b" font-family="Arial" font-size="10" font-weight="bold">${v}</text>`;
    });

    let targetLineSvg = '';
    let targetLabelSvg = '';
    if (targetValue > 0) {
      const targetY = toY(targetValue);
      targetLineSvg = `
        <line x1="${PAD.left}" y1="${targetY}" x2="${WIDTH - PAD.right}" y2="${targetY}" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
        <line x1="${PAD.left}" y1="${targetY}" x2="${PAD.left + 10}" y2="${targetY}" stroke="#3b82f6" stroke-width="2" />`;
      targetLabelSvg = `<text x="${PAD.left + 12}" y="${targetY - 4}" fill="#3b82f6" font-family="Arial" font-size="9" font-weight="bold">Meta: ${targetValue}</text>`;
    }

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
        <rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff" rx="4"/>
        <rect x="1" y="1" width="${WIDTH - 2}" height="${HEIGHT - 2}" fill="none" stroke="#e2e8f0" stroke-width="1" rx="4"/>

        ${gridLines.map((g) => `
          <line x1="${PAD.left}" y1="${g.y}" x2="${WIDTH - PAD.right}" y2="${g.y}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4,4"/>
          <text x="${PAD.left - 8}" y="${g.y + 3}" text-anchor="end" fill="#94a3b8" font-family="Arial" font-size="9">${g.label}</text>
        `).join('')}

        ${targetLineSvg}
        ${targetLabelSvg}

        ${barsSvg}
        ${labelsSvg}

        <rect x="${WIDTH - 170}" y="8" width="162" height="20" fill="#f8fafc" rx="3" stroke="#e2e8f0" stroke-width="1"/>
        <rect x="${WIDTH - 162}" y="12" width="10" height="10" fill="#16a34a" rx="2"/>
        <text x="${WIDTH - 148}" y="20" fill="#475569" font-family="Arial" font-size="9">Cumple</text>
        <rect x="${WIDTH - 110}" y="12" width="10" height="10" fill="#dc2626" rx="2"/>
        <text x="${WIDTH - 96}" y="20" fill="#475569" font-family="Arial" font-size="9">No cumple</text>
        ${targetValue > 0 ? `
        <line x1="${WIDTH - 58}" y1="17" x2="${WIDTH - 48}" y2="17" stroke="#3b82f6" stroke-width="2" stroke-dasharray="3,2"/>
        <text x="${WIDTH - 46}" y="20" fill="#475569" font-family="Arial" font-size="9">Meta</text>` : ''}
      </svg>`;

    return this.svgToDataUrl(svg);
  }

  private svgToDataUrl(svg: string): string {
    const base64 = Buffer.from(svg.trim()).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private formatPercentLabel(value: number): string {
    return `${value.toFixed(2).replace('.', ',')}%`;
  }

  private splitIntoRuns(values: (number | null)[]) {
    const runs: { index: number; value: number }[][] = [];
    let current: { index: number; value: number }[] = [];

    values.forEach((value, index) => {
      if (value === null) {
        if (current.length) runs.push(current);
        current = [];
        return;
      }
      current.push({ index, value });
    });

    if (current.length) runs.push(current);

    return runs;
  }

  /** Interpolación monótona cúbica — el mismo algoritmo de d3-shape/Recharts. */
  private buildMonotonePath(points: { x: number; y: number }[]): string {
    if (points.length === 0) return '';

    const move = `M ${points[0]!.x.toFixed(1)} ${points[0]!.y.toFixed(1)}`;
    if (points.length === 1) return move;
    if (points.length === 2) {
      return `${move} L ${points[1]!.x.toFixed(1)} ${points[1]!.y.toFixed(1)}`;
    }

    const sign = (value: number) => (value < 0 ? -1 : 1);

    const slope3 = (i: number) => {
      const p0 = points[i - 1]!;
      const p1 = points[i]!;
      const p2 = points[i + 1]!;
      const h0 = p1.x - p0.x;
      const h1 = p2.x - p1.x;
      const s0 = (p1.y - p0.y) / (h0 || (h1 < 0 ? -0 : 0));
      const s1 = (p2.y - p1.y) / (h1 || (h0 < 0 ? -0 : 0));
      const p = (s0 * h1 + s1 * h0) / (h0 + h1);

      return (
        (sign(s0) + sign(s1)) *
          Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0
      );
    };

    const slope2 = (i: number, t: number) => {
      const p0 = points[i]!;
      const p1 = points[i + 1]!;
      const h = p1.x - p0.x;

      return h ? (3 * ((p1.y - p0.y) / h) - t) / 2 : t;
    };

    const last = points.length - 1;
    const tangents: number[] = new Array(points.length);

    for (let i = 1; i < last; i += 1) tangents[i] = slope3(i);
    tangents[0] = slope2(0, tangents[1]!);
    tangents[last] = slope2(last - 1, tangents[last - 1]!);

    const segments = points.slice(0, -1).map((point, i) => {
      const next = points[i + 1]!;
      const dx = (next.x - point.x) / 3;
      const c1x = point.x + dx;
      const c1y = point.y + dx * tangents[i]!;
      const c2x = next.x - dx;
      const c2y = next.y - dx * tangents[i + 1]!;

      return `C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
    });

    return `${move} ${segments.join(' ')}`;
  }

  /** Gráfica de línea para el PDF (variante LINE) — idéntica a la web. */
  generateIndicatorLineChartSvg(
    chartData: any[],
    targetValue: number,
    options: { title?: string; seriesName?: string } = {},
  ): string {
    const WIDTH = 900;
    const HEIGHT = 390;
    const PAD = { top: 66, right: 60, bottom: 78, left: 60 };
    const CHART_W = WIDTH - PAD.left - PAD.right;
    const CHART_H = HEIGHT - PAD.top - PAD.bottom;

    const COLOR_SERIES = '#000000';
    const COLOR_TREND = '#d9d9d9';
    const COLOR_META = '#bfbfbf';
    const COLOR_AXIS = '#d0d7de';
    const COLOR_LABEL = '#595959';
    const COLOR_TEXT = '#000000';

    if (!chartData || chartData.length === 0) {
      return this.svgToDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
          <rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff" rx="6"/>
          <text x="${WIDTH / 2}" y="${HEIGHT / 2}" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="13">Sin datos disponibles</text>
        </svg>`);
    }

    const title = this.escapeXml(options.title ?? '');
    const seriesName = this.escapeXml(options.seriesName ?? options.title ?? 'Resultado');

    const periodLabels = chartData.map((point) =>
      this.escapeXml(String(point.period ?? 'N/A').toUpperCase()),
    );
    const values: (number | null)[] = chartData.map((point) =>
      typeof point.medicion === 'number' ? point.medicion : null,
    );
    const trendValues: (number | null)[] = chartData.map((point) => {
      const value = point.tendencia ?? point.trend ?? point.proyeccion;
      return typeof value === 'number' ? value : null;
    });
    const trendCaption = chartData.reduce<number | null>(
      (found, point) => (typeof point.tendenciaFinal === 'number' ? point.tendenciaFinal : found),
      null,
    );

    const metaValue = typeof targetValue === 'number' && Number.isFinite(targetValue) ? targetValue : null;

    const Y_STEP = 20;
    const MIN_Y_MAX = 120;
    const plotted = [...values, ...trendValues].filter(
      (value): value is number => typeof value === 'number',
    );
    const rawMax = Math.max(MIN_Y_MAX, metaValue ?? 0, ...plotted);
    const axisMax = Math.ceil(rawMax / Y_STEP) * Y_STEP;
    const yTicks = Array.from({ length: axisMax / Y_STEP + 1 }, (_, i) => i * Y_STEP);

    const slotW = CHART_W / (chartData.length + 1);
    const metaBarW = Math.min(30, slotW * 0.6);

    const toY = (value: number) => PAD.top + CHART_H - (value / axisMax) * CHART_H;
    const toX = (index: number) => PAD.left + slotW * index + slotW / 2;
    const metaX = PAD.left + slotW * chartData.length + slotW / 2;
    const axisRightX = WIDTH - PAD.right;

    const yAxisSvg = yTicks
      .map((tick) => {
        const y = (toY(tick) + 4).toFixed(1);
        const gridY = toY(tick).toFixed(1);
        return [
          `<line x1="${PAD.left}" y1="${gridY}" x2="${axisRightX}" y2="${gridY}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4,4"/>`,
          `<text x="${(PAD.left - 10).toFixed(1)}" y="${y}" text-anchor="end" fill="${COLOR_LABEL}" font-family="Arial" font-size="10">${tick}%</text>`,
          `<text x="${(axisRightX + 10).toFixed(1)}" y="${y}" text-anchor="start" fill="${COLOR_LABEL}" font-family="Arial" font-size="10">${tick}%</text>`,
        ].join('');
      })
      .join('');

    const axesSvg = [
      `<line x1="${PAD.left}" y1="${PAD.top}" x2="${PAD.left}" y2="${PAD.top + CHART_H}" stroke="${COLOR_AXIS}" stroke-width="1"/>`,
      `<line x1="${axisRightX}" y1="${PAD.top}" x2="${axisRightX}" y2="${PAD.top + CHART_H}" stroke="${COLOR_AXIS}" stroke-width="1"/>`,
      `<line x1="${PAD.left}" y1="${PAD.top + CHART_H}" x2="${axisRightX}" y2="${PAD.top + CHART_H}" stroke="${COLOR_AXIS}" stroke-width="1"/>`,
    ].join('');

    const xLabelY = (PAD.top + CHART_H + 20).toFixed(1);
    const xAxisSvg = [
      ...periodLabels.map(
        (label, i) =>
          `<text x="${toX(i).toFixed(1)}" y="${xLabelY}" text-anchor="middle" fill="${COLOR_TEXT}" font-family="Arial" font-size="9" font-weight="700">${label}</text>`,
      ),
      `<text x="${metaX.toFixed(1)}" y="${xLabelY}" text-anchor="middle" fill="${COLOR_TEXT}" font-family="Arial" font-size="9" font-weight="700">Meta (%)</text>`,
    ].join('');

    let metaBarSvg = '';
    if (metaValue !== null) {
      const barTop = toY(metaValue);
      const barH = (metaValue / axisMax) * CHART_H;
      metaBarSvg = [
        `<rect x="${(metaX - metaBarW / 2).toFixed(1)}" y="${barTop.toFixed(1)}" width="${metaBarW.toFixed(1)}" height="${barH.toFixed(1)}" fill="${COLOR_META}"/>`,
        `<text x="${metaX.toFixed(1)}" y="${(barTop - 8).toFixed(1)}" text-anchor="middle" fill="${COLOR_TEXT}" font-family="Arial" font-size="10" font-weight="700">${this.formatPercentLabel(metaValue)}</text>`,
      ].join('');
    }

    const trendSvg = this.splitIntoRuns(trendValues)
      .filter((run) => run.length > 1)
      .map((run) => {
        const path = run
          .map(
            (point, i) =>
              `${i === 0 ? 'M' : 'L'} ${toX(point.index).toFixed(1)} ${toY(point.value).toFixed(1)}`,
          )
          .join(' ');

        return `<path d="${path}" fill="none" stroke="${COLOR_TREND}" stroke-width="2" stroke-dasharray="6,5"/>`;
      })
      .join('');

    let trendCaptionSvg = '';
    const lastTrendIndex = trendValues.reduce<number>(
      (found, value, i) => (value !== null ? i : found),
      -1,
    );
    const lastTrendValue = lastTrendIndex >= 0 ? trendValues[lastTrendIndex] : null;

    if (trendCaption !== null && lastTrendValue !== null && lastTrendValue !== undefined) {
      const captionX = Math.min(toX(lastTrendIndex), axisRightX - 6).toFixed(1);
      const captionY = (toY(lastTrendValue) - 34).toFixed(1);
      trendCaptionSvg =
        `<text y="${captionY}" text-anchor="end" fill="${COLOR_LABEL}" font-family="Arial" font-size="10">` +
        `<tspan x="${captionX}">Tendencia del</tspan>` +
        `<tspan x="${captionX}" dy="12">${seriesName}: ${this.formatPercentLabel(trendCaption)}</tspan>` +
        `</text>`;
    }

    const seriesRuns = this.splitIntoRuns(values);
    const lineSvg = seriesRuns
      .map((run) => {
        const path = this.buildMonotonePath(
          run.map((point) => ({ x: toX(point.index), y: toY(point.value) })),
        );

        return `<path d="${path}" fill="none" stroke="${COLOR_SERIES}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
      })
      .join('');

    const dotsSvg = seriesRuns
      .flat()
      .map((point) => {
        const cx = toX(point.index).toFixed(1);
        const cy = toY(point.value);

        return [
          `<text x="${cx}" y="${(cy - 12).toFixed(1)}" text-anchor="middle" fill="${COLOR_TEXT}" font-family="Arial" font-size="10" font-weight="700">${this.formatPercentLabel(point.value)}</text>`,
          `<circle cx="${cx}" cy="${cy.toFixed(1)}" r="4" fill="${COLOR_SERIES}"/>`,
        ].join('');
      })
      .join('');

    const legendMarkerW = 34;
    const legendGap = 6;
    const legendX = (WIDTH - (legendMarkerW + legendGap + seriesName.length * 5.2)) / 2;
    const legendY = HEIGHT - 22;
    const legendSvg = [
      `<line x1="${legendX.toFixed(1)}" y1="${legendY}" x2="${(legendX + legendMarkerW).toFixed(1)}" y2="${legendY}" stroke="${COLOR_SERIES}" stroke-width="2.5"/>`,
      `<circle cx="${(legendX + legendMarkerW / 2).toFixed(1)}" cy="${legendY}" r="3.5" fill="${COLOR_SERIES}"/>`,
      `<text x="${(legendX + legendMarkerW + legendGap).toFixed(1)}" y="${(legendY + 4).toFixed(1)}" text-anchor="start" fill="${COLOR_TEXT}" font-family="Arial" font-size="10">${seriesName}</text>`,
    ].join('');

    const titleSvg = title
      ? `<text x="${WIDTH / 2}" y="30" text-anchor="middle" fill="${COLOR_LABEL}" font-family="Arial" font-size="14">${title}</text>`
      : '';

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
        <rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff" rx="6"/>

        ${titleSvg}
        ${yAxisSvg}
        ${axesSvg}
        ${metaBarSvg}
        ${trendSvg}
        ${trendCaptionSvg}
        ${lineSvg}
        ${dotsSvg}
        ${xAxisSvg}
        ${legendSvg}
      </svg>`;

    return this.svgToDataUrl(svg);
  }

  generatePieChartSvg(confiables: number, requierenMejoras: number, suspendidos: number): string {
    const WIDTH = 650;
    const HEIGHT = 260;
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2 - 10;
    const radius = 90;

    const total = confiables + requierenMejoras + suspendidos;

    if (total === 0) {
      return this.svgToDataUrl(`
        <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
          <rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff" rx="4"/>
          <circle cx="${cx}" cy="${cy}" r="${radius}" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
          <text x="${cx}" y="${cy}" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="12">Sin datos de proveedores</text>
        </svg>`);
    }

    const data = [
      { value: confiables, color: '#16a34a', label: 'Confiables' },
      { value: requierenMejoras, color: '#f59e0b', label: 'Requieren Mejoras' },
      { value: suspendidos, color: '#dc2626', label: 'Suspendidos' },
    ].filter((d) => d.value > 0);

    let startAngle = -Math.PI / 2;
    let svgPaths = '';

    const getCoordinatesForAngle = (angle: number) => {
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      return { x, y };
    };

    if (data.length === 1) {
      svgPaths = `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${data[0]!.color}"/>`;
    } else {
      data.forEach((slice) => {
        const sliceAngle = (slice.value / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        const startPt = getCoordinatesForAngle(startAngle);
        const endPt = getCoordinatesForAngle(endAngle);
        const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

        const pathData = [
          `M ${cx} ${cy}`,
          `L ${startPt.x} ${startPt.y}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endPt.x} ${endPt.y}`,
          'Z',
        ].join(' ');

        svgPaths += `<path d="${pathData}" fill="${slice.color}" stroke="#ffffff" stroke-width="2" />`;

        startAngle = endAngle;
      });
    }

    const legendY = HEIGHT - 30;
    const legendX = WIDTH / 2 - 130;

    const legendSvg = `
      <rect x="${legendX}" y="${legendY}" width="10" height="10" fill="#16a34a" rx="2" />
      <text x="${legendX + 15}" y="${legendY + 9}" font-family="Arial" font-size="10" fill="#475569">Confiables (${confiables})</text>

      <rect x="${legendX + 90}" y="${legendY}" width="10" height="10" fill="#f59e0b" rx="2" />
      <text x="${legendX + 105}" y="${legendY + 9}" font-family="Arial" font-size="10" fill="#475569">Mejoras (${requierenMejoras})</text>

      <rect x="${legendX + 180}" y="${legendY}" width="10" height="10" fill="#dc2626" rx="2" />
      <text x="${legendX + 195}" y="${legendY + 9}" font-family="Arial" font-size="10" fill="#475569">Suspendidos (${suspendidos})</text>
    `;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
        <rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff" rx="4"/>
        <rect x="1" y="1" width="${WIDTH - 2}" height="${HEIGHT - 2}" fill="none" stroke="#e2e8f0" stroke-width="1" rx="4"/>
        ${svgPaths}
        ${legendSvg}
        <text x="${cx}" y="20" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold" fill="#64748b">DISTRIBUCIÓN DE PROVEEDORES</text>
      </svg>
    `;

    return this.svgToDataUrl(svg);
  }

  generateBarChartSvg(confiables: number, requierenMejoras: number, suspendidos: number): string {
    const WIDTH = 650;
    const HEIGHT = 260;
    const PAD = { top: 30, right: 20, bottom: 30, left: 40 };
    const CHART_W = WIDTH - PAD.left - PAD.right;
    const CHART_H = HEIGHT - PAD.top - PAD.bottom;

    const data = [
      { category: 'Confiable', value: confiables, color: '#4472c4' },
      { category: 'Requiere mejoras', value: requierenMejoras, color: '#ed7d31' },
      { category: 'Suspendido', value: suspendidos, color: '#a5a5a5' },
    ];

    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const yMax = Math.ceil(maxVal / 5) * 5;

    const barCount = 3;
    const barGap = 40;
    const barWidth = Math.min(76, (CHART_W - barGap * 4) / barCount);
    const usableW = barCount * barWidth + barGap * (barCount + 1);
    const offsetX = PAD.left + (CHART_W - usableW) / 2;

    const toY = (v: number) => PAD.top + CHART_H - (v / yMax) * CHART_H;

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
      y: PAD.top + CHART_H * (1 - f),
      label: Math.round(yMax * f).toString(),
    }));

    let barsSvg = '';
    let labelsSvg = '';

    data.forEach((d, i) => {
      const x = offsetX + barGap + i * (barWidth + barGap);
      const barH = (d.value / yMax) * CHART_H;
      const y = toY(d.value);

      barsSvg += `<path d="M ${x} ${y + barH} L ${x} ${y + 5} Q ${x} ${y} ${x + 5} ${y} L ${x + barWidth - 5} ${y} Q ${x + barWidth} ${y} ${x + barWidth} ${y + 5} L ${x + barWidth} ${y + barH} Z" fill="${d.color}" />`;
      labelsSvg += `<text x="${x + barWidth / 2}" y="${PAD.top + CHART_H + 16}" text-anchor="middle" fill="#374151" font-family="Arial" font-size="11" font-weight="bold">${d.category}</text>`;
      barsSvg += `<text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" fill="#374151" font-family="Arial" font-size="12" font-weight="bold">${d.value}</text>`;
    });

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
        <rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff" rx="4"/>
        <rect x="1" y="1" width="${WIDTH - 2}" height="${HEIGHT - 2}" fill="none" stroke="#e2e8f0" stroke-width="1" rx="4"/>

        ${gridLines.map((g) => `
          <line x1="${PAD.left}" y1="${g.y}" x2="${WIDTH - PAD.right}" y2="${g.y}" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="3,3"/>
          <text x="${PAD.left - 8}" y="${g.y + 4}" text-anchor="end" fill="#6b7280" font-family="Arial" font-size="10">${g.label}</text>
        `).join('')}

        ${barsSvg}
        ${labelsSvg}
        <text x="${WIDTH / 2}" y="20" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold" fill="#64748b">CANTIDAD DE PROVEEDORES POR CLASIFICACIÓN</text>
      </svg>
    `;

    return this.svgToDataUrl(svg);
  }

  // ─── PDF ─────────────────────────────────────────────────────────────────

  async generatePdf(filters: ExportReportFilters = {}) {
    try {
      const rawData = await this.generateJson(filters);
      const chartVariant = filters.chartVariant ?? 'BAR';

      let processName = 'Todos los procesos';
      if (filters.processId) {
        const proc = await repo.findProcessById(filters.processId);
        if (proc) processName = proc.name;
      }

      const indicatorMap = new Map<string, any[]>();
      for (const row of rawData) {
        const key = row.indicatorId;
        if (!indicatorMap.has(key)) {
          indicatorMap.set(key, []);
        }
        indicatorMap.get(key)!.push(row);
      }

      const indicatorSections: any[] = [];
      for (const [, rows] of indicatorMap) {
        const first = rows[0];
        const targetValue = first.target ?? 0;

        let pieChartDataUrl = '';
        let barChartDataUrl = '';

        if (first.chartType === 'PIE') {
          let confiables = 0;
          let requierenMejoras = 0;
          let suspendidos = 0;
          rows.forEach((r: any) => {
            r.rawInputs?.forEach((input: any) => {
              if (input.key === 'proveedoresConfiables') confiables += input.value;
              if (input.key === 'proveedoresRequierenMejoras') requierenMejoras += input.value;
              if (input.key === 'proveedoresSuspendidos') suspendidos += input.value;
            });
          });
          pieChartDataUrl = this.generatePieChartSvg(confiables, requierenMejoras, suspendidos);
          barChartDataUrl = this.generateBarChartSvg(confiables, requierenMejoras, suspendidos);
        }

        let chartDataUrl: string;
        if (chartVariant === 'LINE') {
          const trendChartData = await this.indicatorsService.getChartData(first.indicatorId);
          chartDataUrl = this.generateIndicatorLineChartSvg(trendChartData, targetValue, {
            title: first.indicator,
            seriesName: first.indicator,
          });
        } else {
          chartDataUrl = this.generateIndicatorChartSvg(rows, targetValue);
        }

        const latestRow = rows[rows.length - 1];
        const nonCompliant = rows.some((r) => r.trafficLight === 'RED');

        indicatorSections.push({
          name: first.indicator,
          code: first.indicatorCode,
          process: first.process,
          processCode: first.processCode,
          frequency: first.frequency,
          direction: first.direction,
          formula: first.formula || 'N/A',
          responsible: first.responsible,
          targetValue,
          unit: first.unit || '%',
          chartDataUrl,
          pieChartDataUrl,
          barChartDataUrl,
          isPieChart: first.chartType === 'PIE',
          latestValue: latestRow?.value ?? '-',
          latestCompliance: latestRow?.trafficLight ?? 'GRAY',
          latestObservation: latestRow?.observation || 'Sin observaciones.',
          latestAnalysis: latestRow?.internalAnalysis || 'Sin análisis documentado.',
          rows: rows.map((r: any) => ({
            period: r.period?.startsAt
              ? r.period.startsAt.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
              : 'N/A',
            value: r.value,
            trafficLight: r.trafficLight,
            conclusion:
              r.trafficLight === 'GREEN' ? 'CUMPLE' : r.trafficLight === 'RED' ? 'NO CUMPLE' : 'S/D',
            observation: r.observation || '-',
            internalAnalysis: r.internalAnalysis || '-',
            actionPlans: r.actionPlans || [],
          })),
          hasActionPlans: nonCompliant,
          actionPlans: latestRow?.actionPlans || [],
        });
      }

      const templatePath = path.resolve(__dirname, '..', 'templates', 'report.ejs');

      let logoBase64: string | null = null;
      const logoCandidates = [
        path.resolve(process.cwd(), '../client/public/business.webp'),
        path.resolve(process.cwd(), '../frontend/public/business.webp'),
        path.resolve(process.cwd(), 'public/business.webp'),
      ];
      for (const logoPath of logoCandidates) {
        try {
          if (fs.existsSync(logoPath)) {
            const base64 = fs.readFileSync(logoPath).toString('base64');
            logoBase64 = `data:image/webp;base64,${base64}`;
            break;
          }
        } catch {
          // seguir con el siguiente candidato
        }
      }

      const reportContext = {
        generatedAt: new Date().toLocaleString('es-VE'),
        processName,
        dateRange: {
          startsAt: filters.startsAt ?? null,
          endsAt: filters.endsAt ?? null,
        },
        note: filters.note?.trim() || null,
      };

      const html = await ejs.renderFile(templatePath, {
        matrix: rawData,
        indicatorSections,
        logoBase64,
        reportContext,
      });

      const browser = await puppeteer.launch({ headless: true });
      try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' as any, timeout: 60_000 });
        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
        });

        const pdfBuffer = Buffer.from(pdf as any);

        if (pdfBuffer.length === 0) {
          throw new Error('El generador devolvió un buffer PDF vacío.');
        }

        return pdfBuffer;
      } finally {
        await browser.close();
      }
    } catch (error) {
      console.error('[Executive][Exports] No se pudo generar el PDF:', error instanceof Error ? error.stack : error);
      throw ExecutiveError.badRequest('No se pudo generar el informe PDF.');
    }
  }

  // ─── XLSX ────────────────────────────────────────────────────────────────

  async generateXlsx(filters: ExportReportFilters = {}) {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistema de Gestión Corporativa';
      workbook.created = new Date();

      const sheet = workbook.addWorksheet('Matriz Consolidada');

      sheet.columns = [
        { header: 'Proceso', key: 'process', width: 28 },
        { header: 'Indicador', key: 'indicator', width: 45 },
        { header: 'Meta', key: 'target', width: 12 },
        { header: 'Resultado', key: 'value', width: 12 },
        { header: 'Conclusión', key: 'trafficLight', width: 14 },
        { header: 'Observación', key: 'observation', width: 55 },
      ];

      const data = await this.generateJson(filters);

      const trafficLabel: Record<string, string> = {
        GREEN: 'CUMPLE',
        RED: 'NO CUMPLE',
        GRAY: 'S/D',
      };

      data.forEach((row: any) => {
        const excelRow = sheet.addRow({
          process: row.process,
          indicator: row.indicator,
          target: row.target !== null && row.target !== undefined ? row.target : '-',
          value: row.value !== null && row.value !== undefined ? row.value : '-',
          trafficLight: trafficLabel[row.trafficLight] || '-',
          observation: row.observation || '-',
        });

        const trafficColors: Record<string, string> = {
          GREEN: 'FF16a34a',
          RED: 'FFdc2626',
          GRAY: 'FF94a3b8',
        };
        const color = trafficColors[row.trafficLight];
        if (color) {
          excelRow.getCell('trafficLight').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: color },
          };
          excelRow.getCell('trafficLight').font = { color: { argb: 'FFFFFFFF' }, bold: true };
        }
      });

      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FF1e293b' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFe2e8f0' } };
      headerRow.border = {
        bottom: { style: 'medium', color: { argb: 'FF94a3b8' } },
      };

      if (filters.note?.trim()) {
        sheet.spliceRows(2, 0, [`Nota: ${filters.note.trim()}`]);
        sheet.getRow(2).font = { italic: true, color: { argb: 'FF64748b' } };
      }

      return workbook.xlsx.writeBuffer();
    } catch (error) {
      console.error('[Executive][Exports] Error al generar Excel:', error instanceof Error ? error.stack : error);
      throw ExecutiveError.badRequest('No se pudo generar el archivo Excel.');
    }
  }
}
