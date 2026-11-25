import { PrismaClient } from '@prisma/client';
import {
  IQcDashboardRepository,
  QcMatrixIndicator,
  QcSummaryIndicator,
  QcTrendMeasurement,
} from '../../domain/repositories/qc-dashboard.repository.js';

const ORG_CORP_MAIN = 'CORP_MAIN';

export class PrismaQcDashboardRepository implements IQcDashboardRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findSummaryIndicators(processIds?: string[]): Promise<QcSummaryIndicator[]> {
    return this.prisma.qcIndicator.findMany({
      where: {
        organization: { code: ORG_CORP_MAIN },
        ...(processIds && processIds.length > 0 ? { processId: { in: processIds } } : {}),
      },
      include: {
        versions: {
          where: { effectiveTo: null },
          include: {
            measurements: {
              orderBy: { period: { startsAt: 'desc' } },
              take: 1,
              select: { trafficLight: true },
            },
          },
        },
      },
    });
  }

  async findMatrixIndicators(processIds?: string[]): Promise<QcMatrixIndicator[]> {
    return this.prisma.qcIndicator.findMany({
      where: {
        organization: { code: ORG_CORP_MAIN },
        ...(processIds && processIds.length > 0 ? { processId: { in: processIds } } : {}),
      },
      include: {
        process: { select: { name: true, code: true } },
        versions: {
          where: { effectiveTo: null },
          include: {
            targets: true,
            measurements: {
              orderBy: { period: { startsAt: 'desc' } },
              take: 1,
              include: { period: true },
            },
          },
        },
      },
    });
  }

  async findActivePeriod() {
    const active = await this.prisma.qcReportingPeriod.findFirst({
      where: { status: 'OPEN' },
      orderBy: { startsAt: 'desc' },
    });
    if (active) return active;

    const now = new Date();
    const currentPeriod = await this.prisma.qcReportingPeriod.findFirst({
      where: {
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: { startsAt: 'desc' },
    });
    if (currentPeriod) {
      if (currentPeriod.status !== 'OPEN') {
        await this.prisma.qcReportingPeriod.update({
          where: { id: currentPeriod.id },
          data: { status: 'OPEN' },
        });
        currentPeriod.status = 'OPEN';
      }
      return currentPeriod;
    }

    const latest = await this.prisma.qcReportingPeriod.findFirst({
      orderBy: { startsAt: 'desc' },
    });
    if (latest) {
      if (latest.status !== 'OPEN') {
        await this.prisma.qcReportingPeriod.update({
          where: { id: latest.id },
          data: { status: 'OPEN' },
        });
        latest.status = 'OPEN';
      }
      return latest;
    }

    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    const dueDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 5));

    return this.prisma.qcReportingPeriod.create({
      data: {
        startsAt: startOfMonth,
        endsAt: endOfMonth,
        dueDate,
        status: 'OPEN',
      },
    });
  }

  async findTrendMeasurements(): Promise<QcTrendMeasurement[]> {
    return this.prisma.qcMeasurement.findMany({
      where: {
        version: {
          indicator: {
            organization: { code: ORG_CORP_MAIN },
          },
        },
        trafficLight: { not: null },
      },
      include: {
        period: { select: { startsAt: true } },
        version: {
          include: {
            indicator: {
              include: {
                process: { select: { name: true, code: true } },
              },
            },
          },
        },
      },
      orderBy: { period: { startsAt: 'asc' } },
    });
  }

  async findOwnerProcessIds(userId: string): Promise<string[]> {
    const assignments = await this.prisma.qcUserProcessAssignment.findMany({
      where: { userId },
      select: { processId: true },
    });
    return assignments.map((a) => a.processId);
  }
}
