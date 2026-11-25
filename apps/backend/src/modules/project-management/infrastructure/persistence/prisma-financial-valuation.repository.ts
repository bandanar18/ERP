import { PrismaClient } from '@prisma/client';
import { IFinancialValuationRepository } from '../../domain/repositories/financial-valuation.repository.js';
import { PmFinancialValuation } from '../../domain/entities/financial-valuation.entity.js';
import { prisma } from '../../../../prisma/prisma.js';

export class PrismaFinancialValuationRepository implements IFinancialValuationRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async create(data: Omit<PmFinancialValuation, 'id' | 'createdAt' | 'updatedAt'>): Promise<PmFinancialValuation> {
    const created = await this.db.pmFinancialValuation.create({
      data: {
        projectId: data.projectId,
        valuationNumber: data.valuationNumber,
        amountUsd: data.amountUsd,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        invoiceNumber: data.invoiceNumber,
      },
    });

    return new PmFinancialValuation(
      created.id,
      created.projectId,
      created.valuationNumber,
      Number(created.amountUsd),
      created.startDate,
      created.endDate,
      created.status,
      created.createdAt,
      created.updatedAt,
      created.invoiceNumber
    );
  }

  async update(id: string, data: Partial<Omit<PmFinancialValuation, 'id' | 'createdAt' | 'updatedAt'>>): Promise<PmFinancialValuation> {
    const updated = await this.db.pmFinancialValuation.update({
      where: { id },
      data: {
        projectId: data.projectId,
        valuationNumber: data.valuationNumber,
        amountUsd: data.amountUsd,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        invoiceNumber: data.invoiceNumber,
      },
    });

    return new PmFinancialValuation(
      updated.id,
      updated.projectId,
      updated.valuationNumber,
      Number(updated.amountUsd),
      updated.startDate,
      updated.endDate,
      updated.status,
      updated.createdAt,
      updated.updatedAt,
      updated.invoiceNumber
    );
  }

  async findById(id: string): Promise<PmFinancialValuation | null> {
    const found = await this.db.pmFinancialValuation.findUnique({
      where: { id },
    });

    if (!found) return null;

    return new PmFinancialValuation(
      found.id,
      found.projectId,
      found.valuationNumber,
      Number(found.amountUsd),
      found.startDate,
      found.endDate,
      found.status,
      found.createdAt,
      found.updatedAt,
      found.invoiceNumber
    );
  }

  async findByProjectId(projectId: string): Promise<PmFinancialValuation[]> {
    const records = await this.db.pmFinancialValuation.findMany({
      where: { projectId },
      orderBy: { startDate: 'asc' },
    });

    return records.map((record) => new PmFinancialValuation(
      record.id,
      record.projectId,
      record.valuationNumber,
      Number(record.amountUsd),
      record.startDate,
      record.endDate,
      record.status,
      record.createdAt,
      record.updatedAt,
      record.invoiceNumber
    ));
  }
}
