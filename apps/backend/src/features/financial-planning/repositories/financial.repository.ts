import { PmFinancialValuation, PmValuationStatus, Prisma } from '@prisma/client';
import { prisma } from '../../../prisma/prisma';

export class FinancialRepository {
  async create(data: Prisma.PmFinancialValuationUncheckedCreateInput): Promise<PmFinancialValuation> {
    return prisma.pmFinancialValuation.create({ data });
  }

  async findByProjectId(projectId: string): Promise<PmFinancialValuation[]> {
    return prisma.pmFinancialValuation.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<PmFinancialValuation | null> {
    return prisma.pmFinancialValuation.findUnique({ where: { id } });
  }

  async updateStatus(id: string, status: PmValuationStatus, invoiceNumber?: string): Promise<PmFinancialValuation> {
    return prisma.pmFinancialValuation.update({
      where: { id },
      data: { status, invoiceNumber },
    });
  }

  async getTotalAmountForProject(projectId: string): Promise<number> {
    const result = await prisma.pmFinancialValuation.aggregate({
      where: { projectId },
      _sum: { amountUsd: true },
    });
    return Number(result._sum.amountUsd || 0);
  }
}
