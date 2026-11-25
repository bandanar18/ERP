import { Prisma, PrismaClient, QcMeasurementStatus, QcTrafficLight } from '@prisma/client';
import {
  IQcMeasurementRepository,
  QcMeasurementWithDetails,
} from '../../domain/repositories/qc-measurement.repository.js';
import { ReviewMeasurementDto } from '../../application/dto/qc-measurement.dto.js';

export class PrismaQcMeasurementRepository implements IQcMeasurementRepository {
  constructor(private readonly db: PrismaClient) {}

  async findPeriod(periodId: string) {
    return this.db.qcReportingPeriod.findUnique({ where: { id: periodId } });
  }

  async findVersionWithTargets(indicatorVersionId: string) {
    return this.db.qcIndicatorVersion.findUnique({
      where: { id: indicatorVersionId },
      include: { targets: true },
    });
  }

  async createMeasurement(data: {
    indicatorVersionId: string;
    periodId: string;
    value: number;
    trafficLight: QcTrafficLight;
    submittedById: string;
    observation?: string | null;
  }) {
    return this.db.qcMeasurement.create({
      data: {
        indicatorVersionId: data.indicatorVersionId,
        periodId: data.periodId,
        value: data.value,
        trafficLight: data.trafficLight,
        status: QcMeasurementStatus.SUBMITTED,
        submittedById: data.submittedById,
        observation: data.observation ?? undefined,
      },
    });
  }

  async findExistingMeasurement(indicatorVersionId: string, periodId: string) {
    return this.db.qcMeasurement.findUnique({
      where: {
        uq_qc_measurement_indicator_period: {
          indicatorVersionId,
          periodId,
        },
      },
      select: { id: true, status: true, value: true, submittedById: true },
    });
  }

  async updateMeasurement(id: string, data: { value: number; trafficLight: QcTrafficLight; submittedById: string; observation?: string | null; status: QcMeasurementStatus }) {
    return this.db.qcMeasurement.update({
      where: { id },
      data,
    });
  }

  async createInputs(measurementId: string, inputs: Record<string, number>): Promise<void> {
    await this.db.qcMeasurementInput.createMany({
      data: Object.entries(inputs).map(([key, value]) => ({
        measurementId,
        key,
        value,
      })),
    });
  }

  async findByProcessAssignments(userId: string, status?: QcMeasurementStatus): Promise<QcMeasurementWithDetails[]> {
    const assignments = await this.db.qcUserProcessAssignment.findMany({
      where: { userId },
      select: { processId: true },
    });
    const processIds = assignments.map((a) => a.processId);

    if (processIds.length === 0) return [];

    const whereClause: Prisma.QcMeasurementWhereInput = {
      version: {
        indicator: {
          organization: { code: 'CORP_MAIN' },
          processId: { in: processIds },
        },
      },
    };
    if (status) whereClause.status = status;

    return this.db.qcMeasurement.findMany({
      where: whereClause,
      include: {
        version: { include: { indicator: { include: { process: true } } } },
        period: true,
        submittedBy: { select: { email: true } },
        reviewedBy: { select: { email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(status?: QcMeasurementStatus): Promise<QcMeasurementWithDetails[]> {
    const whereClause: Prisma.QcMeasurementWhereInput = {
      version: {
        indicator: {
          organization: { code: 'CORP_MAIN' },
        },
      },
    };
    if (status) whereClause.status = status;

    return this.db.qcMeasurement.findMany({
      where: whereClause,
      include: {
        version: { include: { indicator: { include: { process: true } } } },
        period: true,
        submittedBy: { select: { email: true } },
        reviewedBy: { select: { email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMeasurementForReview(id: string): Promise<{ id: string; status: string; periodId: string } | null> {
    return this.db.qcMeasurement.findUnique({
      where: { id },
      select: { id: true, status: true, periodId: true },
    });
  }

  async findPeriodStatus(periodId: string): Promise<{ status: string } | null> {
    return this.db.qcReportingPeriod.findUnique({
      where: { id: periodId },
      select: { status: true },
    });
  }

  async updateReview(id: string, data: ReviewMeasurementDto, reviewerId: string): Promise<QcMeasurementWithDetails> {
    return this.db.qcMeasurement.update({
      where: { id },
      data: {
        status: data.status,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        ...(data.observation !== undefined && { observation: data.observation }),
        ...(data.analysisInternal !== undefined && { analysisInternal: data.analysisInternal }),
      },
      include: {
        version: { include: { indicator: { include: { process: true } } } },
        period: true,
        submittedBy: { select: { email: true } },
        reviewedBy: { select: { email: true } },
      },
    });
  }
}
