import { PrismaClient } from '@prisma/client';
import { IQcProcessRepository, QcProcessWithDetails } from '../../domain/repositories/qc-process.repository.js';

export class PrismaQcProcessRepository implements IQcProcessRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAll(): Promise<QcProcessWithDetails[]> {
    // Solo CORP_MAIN (mismo criterio del origen)
    return this.db.qcProcess.findMany({
      where: {
        organization: { code: 'CORP_MAIN' },
      },
      include: {
        children: true,
        qc_indicators: true,
      },
    });
  }

  async findMine(userId: string): Promise<QcProcessWithDetails[]> {
    const assignments = await this.db.qcUserProcessAssignment.findMany({
      where: { userId },
      include: {
        process: {
          include: {
            children: true,
            qc_indicators: {
              include: {
                versions: {
                  where: { effectiveTo: null },
                  include: {
                    targets: true,
                    measurements: {
                      orderBy: { createdAt: 'desc' },
                      take: 1,
                      include: { period: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Deduplicar por processId (puede haber asignaciones duplicadas)
    const seen = new Set<string>();
    return assignments
      .filter((a) => {
        if (seen.has(a.processId)) return false;
        seen.add(a.processId);
        return true;
      })
      .map((a) => a.process);
  }
}
