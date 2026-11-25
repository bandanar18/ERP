import { Prisma, QcMeasurement, QcMeasurementStatus, QcReportingPeriod, QcTrafficLight } from '@prisma/client';
import { ReviewMeasurementDto } from '../../application/dto/qc-measurement.dto.js';

export type QcIndicatorVersionWithTargets = Prisma.QcIndicatorVersionGetPayload<{
  include: { targets: true };
}>;

export type QcMeasurementWithDetails = Prisma.QcMeasurementGetPayload<{
  include: {
    version: { include: { indicator: { include: { process: true } } } };
    period: true;
    submittedBy: { select: { email: true } };
    reviewedBy: { select: { email: true } };
  };
}>;

export interface IQcMeasurementRepository {
  findPeriod(periodId: string): Promise<QcReportingPeriod | null>;
  findVersionWithTargets(indicatorVersionId: string): Promise<QcIndicatorVersionWithTargets | null>;
  createMeasurement(data: {
    indicatorVersionId: string;
    periodId: string;
    value: number;
    trafficLight: QcTrafficLight;
    submittedById: string;
    observation?: string | null;
  }): Promise<QcMeasurement>;
  findExistingMeasurement(indicatorVersionId: string, periodId: string): Promise<{ id: string; status: string; value?: number | null; submittedById?: string } | null>;
  updateMeasurement(id: string, data: { value: number; trafficLight: QcTrafficLight; submittedById: string; observation?: string | null; status: QcMeasurementStatus }): Promise<QcMeasurement>;
  createInputs(measurementId: string, inputs: Record<string, number>): Promise<void>;
  findByProcessAssignments(userId: string, status?: QcMeasurementStatus): Promise<QcMeasurementWithDetails[]>;
  findAll(status?: QcMeasurementStatus): Promise<QcMeasurementWithDetails[]>;
  findMeasurementForReview(id: string): Promise<{ id: string; status: string; periodId: string } | null>;
  findPeriodStatus(periodId: string): Promise<{ status: string } | null>;
  updateReview(id: string, data: ReviewMeasurementDto, reviewerId: string): Promise<QcMeasurementWithDetails>;
}
