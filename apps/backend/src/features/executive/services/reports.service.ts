import * as repo from '../repositories/executive.repository';

/**
 * MÓDULO EJECUTIVO — Reportes.
 */
export class ReportsService {
  async generatePerformanceReport(periodId?: string) {
    const measurements = await repo.findMeasurementsForReport(periodId);

    const report = {
      totalIndicators: measurements.length,
      complying: 0,
      notComplying: 0,
      byProcess: {} as Record<string, any[]>,
    };

    measurements.forEach((m) => {
      if (m.trafficLight === 'GREEN') report.complying++;
      else if (m.trafficLight === 'RED') report.notComplying++;

      const processName = m.version.indicator.process.name;
      if (!report.byProcess[processName]) {
        report.byProcess[processName] = [];
      }

      report.byProcess[processName]!.push({
        indicator: m.version.indicator.name,
        value: m.value,
        status: m.trafficLight,
      });
    });

    return report;
  }
}
