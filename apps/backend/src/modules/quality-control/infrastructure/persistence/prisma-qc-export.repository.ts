import { PrismaClient } from '@prisma/client';
import type { ExportReportDto } from '../../application/dto/qc-admin.dto.js';
import {
  IQcExportRepository,
  QcExportMeasurement,
} from '../../domain/repositories/qc-export.repository.js';

const ORG_CORP_MAIN = 'CORP_MAIN';

export class PrismaQcExportRepository implements IQcExportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findReportMeasurements(filters: ExportReportDto): Promise<QcExportMeasurement[]> {
    console.log('[QC-Export] Filters:', JSON.stringify(filters));

    const where: any = {
      version: {
        indicator: {
          organization: { code: ORG_CORP_MAIN },
          ...(filters.processId ? { processId: filters.processId } : {}),
        },
      },
    };

    if (filters.startsAt || filters.endsAt) {
      const periodWhere: any = {};
      if (filters.endsAt) {
        periodWhere.startsAt = { lte: new Date(`${filters.endsAt}T23:59:59.999Z`) };
      }
      if (filters.startsAt) {
        periodWhere.endsAt = { gte: new Date(`${filters.startsAt}T00:00:00.000Z`) };
      }
      console.log('[QC-Export] Period where:', JSON.stringify(periodWhere));
      const matchingPeriods = await this.prisma.qcReportingPeriod.findMany({
        where: periodWhere,
        select: { id: true, startsAt: true, endsAt: true },
      });
      console.log(`[QC-Export] Found ${matchingPeriods.length} matching periods:`, matchingPeriods.map(p => `${p.id} (${p.startsAt.toISOString()} — ${p.endsAt.toISOString()})`));
      const periodIds = matchingPeriods.map((p) => p.id);
      if (periodIds.length === 0) {
        console.log('[QC-Export] No matching periods found — returning empty');
        return [];
      }
      where.periodId = { in: periodIds };
    }

    const measurements = await this.prisma.qcMeasurement.findMany({
      where,
      include: {
        inputs: true,
        submittedBy: true,
        period: true,
        actionPlans: { include: { owner: { select: { id: true, email: true } } } },
        version: {
          include: {
            targets: true,
            indicator: { include: { process: true } },
          },
        },
      },
      orderBy: [
        { version: { indicator: { process: { name: 'asc' } } } },
        { period: { startsAt: 'asc' } },
      ],
    });

    console.log(`[QC-Export] Found ${measurements.length} measurements`);
    return measurements;
  }

  async findProcessName(processId: string): Promise<string | null> {
    const process = await this.prisma.qcProcess.findUnique({
      where: { id: processId },
      select: { name: true },
    });
    return process?.name ?? null;
  }
}
