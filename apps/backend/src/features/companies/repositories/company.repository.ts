import { prisma } from '@/config/database';
import { PmCompany } from '@prisma/client';
import {
  CreateCompanyRequest,
  UpdateCompanyRequest,
  CompanyWithRelations,
} from '../interfaces/company.types';

export class CompanyRepository {
  async findAll(includeCount = false): Promise<CompanyWithRelations[]> {
    return prisma.pmCompany.findMany({
      orderBy: { createdAt: 'desc' },
      include: includeCount
        ? {
            _count: {
              select: { users: true, pm_projects: true },
            },
          }
        : undefined,
    }) as Promise<CompanyWithRelations[]>;
  }

  async findById(id: string): Promise<CompanyWithRelations | null> {
    return prisma.pmCompany.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, pm_projects: true },
        },
      },
    }) as Promise<CompanyWithRelations | null>;
  }

  async findByTaxId(taxId: string): Promise<PmCompany | null> {
    return prisma.pmCompany.findFirst({
      where: { taxId },
    });
  }

  async findByName(name: string): Promise<PmCompany | null> {
    return prisma.pmCompany.findFirst({
      where: { name },
    });
  }

  async create(data: CreateCompanyRequest): Promise<CompanyWithRelations> {
    return prisma.pmCompany.create({
      data,
      include: {
        _count: {
          select: { users: true, pm_projects: true },
        },
      },
    }) as Promise<CompanyWithRelations>;
  }

  async update(id: string, data: UpdateCompanyRequest): Promise<CompanyWithRelations> {
    return prisma.pmCompany.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { users: true, pm_projects: true },
        },
      },
    }) as Promise<CompanyWithRelations>;
  }

  async delete(id: string): Promise<void> {
    await prisma.pmCompany.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.pmCompany.count({ where: { id } });
    return count > 0;
  }
}
