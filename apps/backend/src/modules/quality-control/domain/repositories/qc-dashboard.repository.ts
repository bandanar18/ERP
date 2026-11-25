import { Prisma, QcReportingPeriod } from '@prisma/client';

/** Indicador con versión activa y su última medición (para summary). */
export type QcSummaryIndicator = Prisma.QcIndicatorGetPayload<{
  include: {
    versions: {
      where: { effectiveTo: null };
      include: {
        measurements: {
          orderBy: { period: { startsAt: 'desc' } };
          take: 1;
          select: { trafficLight: true };
        };
      };
    };
  };
}>;

/** Indicador con proceso, versión activa, targets y última medición completa (para matrix). */
export type QcMatrixIndicator = Prisma.QcIndicatorGetPayload<{
  include: {
    process: { select: { name: true; code: true } };
    versions: {
      where: { effectiveTo: null };
      include: {
        targets: true;
        measurements: {
          orderBy: { period: { startsAt: 'desc' } };
          take: 1;
          include: { period: true };
        };
      };
    };
  };
}>;

/** Medición con período e indicador/proceso (para director/trend). */
export type QcTrendMeasurement = Prisma.QcMeasurementGetPayload<{
  include: {
    period: { select: { startsAt: true } };
    version: {
      include: {
        indicator: {
          include: {
            process: { select: { name: true; code: true } };
          };
        };
      };
    };
  };
}>;

export interface IQcDashboardRepository {
  /** Indicadores de CORP_MAIN (o filtrados por procesos) con versión activa + última medición. */
  findSummaryIndicators(processIds?: string[]): Promise<QcSummaryIndicator[]>;
  /** Indicadores de CORP_MAIN con proceso + versión activa + targets + última medición. */
  findMatrixIndicators(processIds?: string[]): Promise<QcMatrixIndicator[]>;
  /** Período de reporte OPEN más reciente. */
  findActivePeriod(): Promise<QcReportingPeriod | null>;
  /** Mediciones con semáforo de CORP_MAIN ordenadas por período asc (para tendencia). */
  findTrendMeasurements(): Promise<QcTrendMeasurement[]>;
  /** Ids de procesos asignados al usuario (scope del QC_OWNER). */
  findOwnerProcessIds(userId: string): Promise<string[]>;
}
