import { Prisma } from '@prisma/client';

/** Medición con versión, indicador y proceso para el reporte de performance. */
export type QcReportMeasurement = Prisma.QcMeasurementGetPayload<{
  include: {
    version: {
      include: {
        indicator: {
          include: {
            process: true;
          };
        };
      };
    };
  };
}>;

export interface IQcReportRepository {
  /** Mediciones de CORP_MAIN, opcionalmente filtradas por período. */
  findPerformanceMeasurements(periodId?: string): Promise<QcReportMeasurement[]>;
}
