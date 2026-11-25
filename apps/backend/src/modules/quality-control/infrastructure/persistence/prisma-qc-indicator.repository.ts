import { PrismaClient } from '@prisma/client';
import {
  IQcIndicatorRepository,
  QcIndicatorDetail,
  QcIndicatorVersionWithTargets,
  QcMeasurementWithPeriodInputs,
  QcProcurementMeasurement,
} from '../../domain/repositories/qc-indicator.repository.js';
import { QcReportingPeriod } from '@prisma/client';

export class PrismaQcIndicatorRepository implements IQcIndicatorRepository {
  constructor(private readonly db: PrismaClient) {}

  async getIndicatorDetail(id: string): Promise<QcIndicatorDetail | null> {
    return this.db.qcIndicator.findFirst({
      where: {
        id,
        organization: { code: 'CORP_MAIN' },
      },
      include: {
        process: true,
        project: true,
        organization: true,
        versions: {
          where: { effectiveTo: null },
          include: {
            targets: true,
            measurements: {
              include: {
                period: true,
                submittedBy: { select: { id: true, email: true } },
                inputs: true,
                actionPlans: {
                  include: { owner: { select: { id: true, email: true } } },
                },
              },
              orderBy: { period: { startsAt: 'desc' } },
              take: 5,
            },
          },
        },
      },
    });
  }

  async getActiveVersionsWithTargets(): Promise<QcIndicatorVersionWithTargets[]> {
    return this.db.qcIndicatorVersion.findMany({
      where: {
        effectiveTo: null,
        indicator: { organization: { code: 'CORP_MAIN' } },
      },
      include: { targets: true },
    });
  }

  async getMeasurementsForChart(periodId?: string): Promise<QcMeasurementWithPeriodInputs[]> {
    return this.db.qcMeasurement.findMany({
      where: {
        ...(periodId ? { periodId } : {}),
        version: {
          indicator: { organization: { code: 'CORP_MAIN' } },
        },
      },
      include: { period: true, inputs: true },
      orderBy: { period: { startsAt: 'asc' } },
    });
  }

  async getActiveVersionByIndicator(indicatorId: string): Promise<QcIndicatorVersionWithTargets | null> {
    return this.db.qcIndicatorVersion.findFirst({
      where: {
        indicatorId,
        effectiveTo: null,
        indicator: { organization: { code: 'CORP_MAIN' } },
      },
      include: { targets: true },
    });
  }

  async getMeasurementsByVersion(versionId: string, periodId?: string): Promise<QcMeasurementWithPeriodInputs[]> {
    return this.db.qcMeasurement.findMany({
      where: {
        indicatorVersionId: versionId,
        ...(periodId ? { periodId } : {}),
        version: {
          indicator: { organization: { code: 'CORP_MAIN' } },
        },
      },
      include: { period: true, inputs: true },
      orderBy: { period: { startsAt: 'asc' } },
    });
  }

  async getProcurementMeasurements(
    indicatorId: string,
    startsAt?: string,
    endsAt?: string,
  ): Promise<QcProcurementMeasurement[]> {
    return this.db.qcMeasurement.findMany({
      where: {
        version: {
          indicatorId,
          indicator: {
            organization: { code: 'CORP_MAIN' },
          },
        },
        period: {
          ...(startsAt ? { startsAt: { gte: new Date(startsAt) } } : {}),
          ...(endsAt ? { endsAt: { lte: new Date(endsAt) } } : {}),
        },
      },
      include: {
        inputs: true,
      },
    });
  }

  async getReportingPeriods(periodId?: string): Promise<QcReportingPeriod[]> {
    return this.db.qcReportingPeriod.findMany({
      where: {
        deletedAt: null,
        ...(periodId ? { id: periodId } : {}),
      },
      orderBy: { startsAt: 'asc' },
    });
  }
}
