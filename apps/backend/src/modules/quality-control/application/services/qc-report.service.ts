import { QcTrafficLight } from '@prisma/client';
import { IQcReportRepository } from '../../domain/repositories/qc-report.repository.js';

export interface QcReportByProcessItem {
  indicator: string;
  value: number | null;
  status: QcTrafficLight | null;
}

export interface QcPerformanceReport {
  totalIndicators: number;
  complying: number;
  notComplying: number;
  byProcess: Record<string, QcReportByProcessItem[]>;
}

export class QcReportService {
  constructor(private readonly repo: IQcReportRepository) {}

  async generatePerformanceReport(periodId?: string): Promise<QcPerformanceReport> {
    const measurements = await this.repo.findPerformanceMeasurements(periodId);

    const report: QcPerformanceReport = {
      totalIndicators: measurements.length,
      complying: 0,
      notComplying: 0,
      byProcess: {},
    };

    for (const m of measurements) {
      if (m.trafficLight === 'GREEN') report.complying += 1;
      else if (m.trafficLight === 'RED') report.notComplying += 1;

      const processName = m.version.indicator.process.name;
      if (!report.byProcess[processName]) {
        report.byProcess[processName] = [];
      }

      report.byProcess[processName].push({
        indicator: m.version.indicator.name,
        value: m.value,
        status: m.trafficLight,
      });
    }

    return report;
  }
}
