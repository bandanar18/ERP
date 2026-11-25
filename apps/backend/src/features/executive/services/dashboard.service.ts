import * as repo from '../repositories/executive.repository';

/**
 * MÓDULO EJECUTIVO — Dashboard.
 * Portado fiel de DashboardService (proyecto "Resumen Ejecutivo").
 */
export class DashboardService {
  private async calculateSummary(whereIndicatorFilters: any = {}) {
    const indicators = await repo.findIndicatorsWithLatest(whereIndicatorFilters);

    const summary = { total: indicators.length, green: 0, red: 0, gray: 0, yellow: 0 };

    for (const ind of indicators) {
      const latestStatus = ind.versions[0]?.measurements[0]?.trafficLight || 'GRAY';
      if (latestStatus === 'GREEN') summary.green += 1;
      else if (latestStatus === 'RED') summary.red += 1;
      else summary.gray += 1;
    }

    return summary;
  }

  async getGlobalSummary() {
    return this.calculateSummary({ organization: { code: 'CORP_MAIN' } });
  }

  async getOwnerSummary(processIds: string[]) {
    if (!processIds || processIds.length === 0) {
      return { total: 0, green: 0, red: 0, gray: 0 };
    }

    return this.calculateSummary({ processId: { in: processIds } });
  }

  async getActivePeriod() {
    return repo.findOpenPeriod();
  }

  async getConsolidatedMatrix() {
    const indicators = await repo.findIndicatorsMatrix();

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
        direction: v?.direction,
        targetValue: target?.targetValue,
        unit: target?.unit,
        latestMeasurement: m ? m.value : null,
        complianceStatus: m?.trafficLight || 'GRAY',
        period: m?.period?.startsAt ? new Date(m.period.startsAt).toISOString() : null,
        conclusion: m?.analysisInternal || null,
        observation: m?.observation || null,
      };
    });
  }

  async getComplianceTrend() {
    const measurements = await repo.findMeasurementsForTrend();

    const grouped = new Map<
      string,
      { sortKey: number; period: string; processes: Record<string, any> }
    >();

    for (const m of measurements) {
      const date = m.period?.startsAt;
      if (!date) continue;

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

    const result = Array.from(grouped.values())
      .sort((a, b) => a.sortKey - b.sortKey)
      .map((entry) => {
        const procs = Object.values(entry.processes) as any[];
        const total = procs.reduce((s: number, p: any) => s + p.total, 0);
        const greenTotal = procs.reduce((s: number, p: any) => s + p.green, 0);

        const processesData: Record<string, number | string> = {};
        for (const p of procs) {
          processesData[`proc_${p.code}`] = p.green;
          processesData[`proc_${p.code}_total`] = p.total;
          processesData[`proc_${p.code}_name`] = p.name;
        }

        return {
          period: entry.period,
          totalGreen: greenTotal,
          totalRed: procs.reduce((s: number, p: any) => s + p.red, 0),
          total,
          compliancePct: total > 0 ? Math.round((greenTotal / total) * 100) : 0,
          ...processesData,
        };
      });

    return result;
  }
}
