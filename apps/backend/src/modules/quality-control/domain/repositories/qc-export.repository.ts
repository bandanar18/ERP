import { Prisma } from '@prisma/client';
import type { ExportReportDto } from '../../application/dto/qc-admin.dto.js';

/** Medición completa para los exports (inputs, actor, período, plan de acción, versión/indicador/proceso). */
export type QcExportMeasurement = Prisma.QcMeasurementGetPayload<{
  include: {
    inputs: true;
    submittedBy: true;
    period: true;
    actionPlans: { include: { owner: { select: { id: true; email: true } } } };
    version: {
      include: {
        targets: true;
        indicator: { include: { process: true } };
      };
    };
  };
}>;

export interface IQcExportRepository {
  /** Mediciones de CORP_MAIN con filtros (proceso y rango de fechas), ordenadas por proceso y período. */
  findReportMeasurements(filters: ExportReportDto): Promise<QcExportMeasurement[]>;
  findProcessName(processId: string): Promise<string | null>;
}
