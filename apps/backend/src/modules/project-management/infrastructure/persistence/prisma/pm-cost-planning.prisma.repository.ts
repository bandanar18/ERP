import { PrismaClient } from '@prisma/client';
import { PmCostPlanning } from '../../../domain/entities/pm-cost-planning.entity.js';
import { IPmCostPlanningRepository } from '../../../domain/repositories/pm-cost-planning.repository.interface.js';

export class PmCostPlanningPrismaRepository implements IPmCostPlanningRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: Omit<PmCostPlanning, 'id' | 'createdAt' | 'updatedAt'>): Promise<PmCostPlanning> {
    const created = await this.prisma.pmCostPlanning.create({
      data: {
        projectId: data.projectId,
        amountUsd: data.amountUsd,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });

    return {
      id: created.id,
      projectId: created.projectId,
      amountUsd: Number(created.amountUsd),
      startDate: created.startDate,
      endDate: created.endDate,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async findByProjectId(projectId: string): Promise<PmCostPlanning[]> {
    const records = await this.prisma.pmCostPlanning.findMany({
      where: { projectId },
      orderBy: { startDate: 'asc' },
    });

    return records.map(record => ({
      id: record.id,
      projectId: record.projectId,
      amountUsd: Number(record.amountUsd),
      startDate: record.startDate,
      endDate: record.endDate,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
  }
}
