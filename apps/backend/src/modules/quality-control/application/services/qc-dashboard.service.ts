import { IQcDashboardRepository } from '../../domain/repositories/qc-dashboard.repository.js';

export interface QcSummary {
  total: number;
  green: number;
  red: number;
  gray: number;
  yellow: number;
}

export interface QcMatrixEntry {
  id: string;
  process: string;
  processCode: string;
  code: string;
  name: string;
  frequency: string;
  direction: string | null;
  targetValue: number | null;
  unit: string | null;
  latestMeasurement: number | null;
  complianceStatus: string;
  period: string | null;
  conclusion: string | null;
  observation: string | null;
}

export interface QcTrendEntry {
  period: string;
  totalGreen: number;
  totalRed: number;
  total: number;
  compliancePct: number;
  [key: string]: string | number;
}

export class QcDashboardService {
  constructor(private readonly repo: IQcDashboardRepository) {}

  private async calculateSummary(processIds?: string[]): Promise<QcSummary> {
    const indicators = await this.repo.findSummaryIndicators(processIds);

    const summary: QcSummary = { total: indicators.length, green: 0, red: 0, gray: 0, yellow: 0 };

    for (const ind of indicators) {
      const latestStatus = ind.versions[0]?.measurements[0]?.trafficLight || 'GRAY';
      if (latestStatus === 'GREEN') summary.green += 1;
      else if (latestStatus === 'RED') summary.red += 1;
      else summary.gray += 1;
    }

    return summary;
  }

  async getGlobalSummary(): Promise<QcSummary> {
    return this.calculateSummary();
  }

  async getOwnerSummary(userId: string): Promise<QcSummary> {
    const processIds = await this.repo.findOwnerProcessIds(userId);
    if (!processIds || processIds.length === 0) {
      return { total: 0, green: 0, red: 0, gray: 0, yellow: 0 };
    }
    return this.calculateSummary(processIds);
  }

  async getActivePeriod() {
    return this.repo.findActivePeriod();
  }

  async getConsolidatedMatrix(userId?: string): Promise<QcMatrixEntry[]> {
    let processIds: string[] | undefined;
    if (userId) {
      processIds = await this.repo.findOwnerProcessIds(userId);
      // If the owner has no assigned processes, return an empty array
      if (!processIds || processIds.length === 0) return [];
    }

    const indicators = await this.repo.findMatrixIndicators(processIds);

    return indicators.map((ind) => {
      const v = ind.versions[0];
      const m = v?.measurements?.[0];
      const target = v?.targets?.[0];
      return {
        id: ind.id,
        process: ind.process.name,
        processCode: ind.process.code,
        code: ind.code,
        name: ind.name,
        frequency: v?.frequency || 'N/A',
        direction: v?.direction ?? null,
        targetValue: target?.targetValue ?? null,
        unit: target?.unit ?? null,
        latestMeasurement: m ? m.value : null,
        complianceStatus: m?.trafficLight || 'GRAY',
        period: m?.period?.startsAt ? new Date(m.period.startsAt).toISOString() : null,
        conclusion: m?.analysisInternal || null,
        observation: m?.observation || null,
      };
    });
  }

  async getComplianceTrend(): Promise<QcTrendEntry[]> {
    const measurements = await this.repo.findTrendMeasurements();

    // Agrupar por mes usando la fecha real como orden
    const grouped = new Map<string, { sortKey: number; period: string; processes: Record<string, { name: string; code: string; green: number; red: number; total: number }> }>();

    for (const m of measurements) {
      const date = m.period?.startsAt;
      if (!date) continue;

      // Usar año-mes como clave de orden estable (ej: "2026-01")
      const sortKey = date.getFullYear() * 100 + (date.getMonth() + 1);
      const label = date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });

      const processCode = m.version?.indicator?.process?.code || '—';
      const processName = m.version?.indicator?.process?.name || 'Sin proceso';

      if (!grouped.has(label)) {
        grouped.set(label, { sortKey, period: label, processes: {} });
      }

      const entry = grouped.get(label)!;
      if (!entry.processes[processCode]) {
        entry.processes[processCode] = {
          name: processName,
          code: processCode,
          green: 0,
          red: 0,
          total: 0,
        };
      }

      const p = entry.processes[processCode];
      p.total += 1;
      if (m.trafficLight === 'GREEN') p.green += 1;
      else if (m.trafficLight === 'RED') p.red += 1;
    }

    // Convertir a array ordenado por sortKey (año-mes), incluyendo desglose por proceso
    const result: QcTrendEntry[] = Array.from(grouped.values())
      .sort((a, b) => a.sortKey - b.sortKey)
      .map((entry) => {
        const procs = Object.values(entry.processes);
        const total = procs.reduce((s, p) => s + p.total, 0);
        const greenTotal = procs.reduce((s, p) => s + p.green, 0);

        // Construir objeto plano con una key por proceso para stacked bar
        const processesData: Record<string, string | number> = {};
        for (const p of procs) {
          processesData[`proc_${p.code}`] = p.green;
          processesData[`proc_${p.code}_total`] = p.total;
          processesData[`proc_${p.code}_name`] = p.name;
        }

        return {
          period: entry.period,
          totalGreen: greenTotal,
          totalRed: procs.reduce((s, p) => s + p.red, 0),
          total,
          compliancePct: total > 0 ? Math.round((greenTotal / total) * 100) : 0,
          ...processesData,
        };
      });

    return result;
  }
}
