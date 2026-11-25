import { CostPlanningRepository } from '../repositories/cost.repository';
import { CreateCostPlanningRequest, CostPlanningResponse, GroupedCostsResponse, GroupedCostsPeriod, GroupedCostPoint } from '../interfaces/cost.types';
import { prisma } from '../../../prisma/prisma';
import { Prisma } from '@prisma/client';

export class CostPlanningService {
  private repository: CostPlanningRepository;

  constructor() {
    this.repository = new CostPlanningRepository();
  }

  async create(data: CreateCostPlanningRequest): Promise<CostPlanningResponse> {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (start > end) {
      throw new Error('La fecha de fin no puede ser menor a la fecha de inicio');
    }

    return await prisma.$transaction(async (tx) => {
      const project = await tx.pmProject.findUnique({ where: { id: data.projectId } });
      if (!project) {
        throw new Error('Proyecto no encontrado');
      }

      const amountUsdDec = new Prisma.Decimal(data.amountUsd);

      const costPlanning = await tx.pmCostPlanning.create({
        data: {
          projectId: data.projectId,
          amountUsd: amountUsdDec,
          startDate: start,
          endDate: end,
        }
      });

      return this.mapToResponse(costPlanning);
    });
  }

  async getByProjectId(projectId: string): Promise<CostPlanningResponse[]> {
    const costs = await this.repository.findByProjectId(projectId);
    return costs.map(c => this.mapToResponse(c));
  }

  private mapToResponse(c: any): CostPlanningResponse {
    return {
      id: c.id,
      projectId: c.projectId,
      amountUsd: Number(c.amountUsd),
      startDate: c.startDate.toISOString(),
      endDate: c.endDate.toISOString(),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  async getGroupedCosts(projectId: string, period: GroupedCostsPeriod = 'monthly'): Promise<GroupedCostsResponse> {
    const costs = await this.repository.findByProjectId(projectId);

    const grouped = new Map<string, number>();

    for (const cost of costs) {
      const date = new Date(cost.startDate);
      let key: string;

      if (period === 'weekly') {
        const weekNum = this.getISOWeek(date);
        key = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      grouped.set(key, (grouped.get(key) || 0) + Number(cost.amountUsd));
    }

    const costsArray: GroupedCostPoint[] = Array.from(grouped.entries())
      .map(([period, amount]) => ({ period, amount }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return {
      projectId,
      period,
      costs: costsArray,
    };
  }

  private getISOWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}
