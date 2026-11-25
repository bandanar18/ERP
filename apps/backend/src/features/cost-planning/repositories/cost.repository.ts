import { PmCostPlanning, Prisma } from '@prisma/client';
import { prisma } from '../../../prisma/prisma';

export class CostPlanningRepository {
  async create(data: Prisma.PmCostPlanningUncheckedCreateInput): Promise<PmCostPlanning> {
    return prisma.pmCostPlanning.create({ data });
  }

  async findByProjectId(projectId: string): Promise<PmCostPlanning[]> {
    return prisma.pmCostPlanning.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<PmCostPlanning | null> {
    return prisma.pmCostPlanning.findUnique({ where: { id } });
  }

  async getTotalAmountForProject(projectId: string): Promise<number> {
    const result = await prisma.pmCostPlanning.aggregate({
      where: { projectId },
      _sum: { amountUsd: true },
    });
    return Number(result._sum.amountUsd || 0);
  }
}
