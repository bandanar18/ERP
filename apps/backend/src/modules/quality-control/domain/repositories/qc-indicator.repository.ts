import { Prisma, QcReportingPeriod } from '@prisma/client';

export type QcIndicatorDetail = Prisma.QcIndicatorGetPayload<{
  include: {
    process: true;
    project: true;
    organization: true;
    versions: {
      where: { effectiveTo: null };
      include: {
        targets: true;
        measurements: {
          include: {
            period: true;
            submittedBy: { select: { id: true; email: true } };
            inputs: true;
            actionPlans: { include: { owner: { select: { id: true; email: true } } } };
          };
          orderBy: { period: { startsAt: 'desc' } };
          take: 5;
        };
      };
    };
  };
}>;

export type QcIndicatorVersionWithTargets = Prisma.QcIndicatorVersionGetPayload<{
  include: { targets: true };
}>;

export type QcMeasurementWithPeriodInputs = Prisma.QcMeasurementGetPayload<{
  include: { period: true; inputs: true };
}>;

export type QcProcurementMeasurement = Prisma.QcMeasurementGetPayload<{
  include: { inputs: true };
}>;

export interface IQcIndicatorRepository {
  getIndicatorDetail(id: string): Promise<QcIndicatorDetail | null>;
  getActiveVersionsWithTargets(): Promise<QcIndicatorVersionWithTargets[]>;
  getMeasurementsForChart(periodId?: string): Promise<QcMeasurementWithPeriodInputs[]>;
  getActiveVersionByIndicator(indicatorId: string): Promise<QcIndicatorVersionWithTargets | null>;
  getMeasurementsByVersion(versionId: string, periodId?: string): Promise<QcMeasurementWithPeriodInputs[]>;
  getProcurementMeasurements(indicatorId: string, startsAt?: string, endsAt?: string): Promise<QcProcurementMeasurement[]>;
  getReportingPeriods(periodId?: string): Promise<QcReportingPeriod[]>;
}
