import { PrismaClient } from '@prisma/client';
import {
  IQcReportRepository,
  QcReportMeasurement,
} from '../../domain/repositories/qc-report.repository.js';

const ORG_CORP_MAIN = 'CORP_MAIN';

export class PrismaQcReportRepository implements IQcReportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findPerformanceMeasurements(periodId?: string): Promise<QcReportMeasurement[]> {
    return this.prisma.qcMeasurement.findMany({
      where: {
        ...(periodId ? { periodId } : {}),
        version: {
          indicator: {
            organization: { code: ORG_CORP_MAIN },
          },
        },
      },
      include: {
        version: {
          include: {
            indicator: {
              include: {
                process: true,
              },
            },
          },
        },
      },
    });
  }
}
