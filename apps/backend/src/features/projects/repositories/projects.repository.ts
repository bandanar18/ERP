import { prisma } from '../../../prisma/prisma';
import { Prisma } from '@prisma/client';
import { CreateProjectRequest, UpdateProjectRequest } from '../interfaces';
import { buildPlannerProjectsWhere } from '../../auth/utils/planner-access';

export class ProjectsRepository {
  async findAll(companyId: string) {
    return await prisma.pmProject.findMany({
      where: { companyId },
      include: {
        pm_users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        pm_companies: {
          select: { id: true, name: true, taxId: true, legalName: true, address: true, phone: true, email: true, logoUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(data: CreateProjectRequest & { companyId: string }) {
    return await prisma.pmProject.create({
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
  }

  async update(id: string, data: UpdateProjectRequest) {
    return await prisma.pmProject.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  async findById(id: string) {
    return await prisma.pmProject.findUnique({
      where: { id },
      include: {
        pm_users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        pm_companies: {
          select: { id: true, name: true, taxId: true, legalName: true, address: true, phone: true, email: true, logoUrl: true }
        },
        pm_physical_progress: {
          orderBy: { date: 'desc' },
          take: 1,
        },
        pm_obligations: {
          include: { payments: true },
        },
        pm_expenses: true,
        pm_collections: true,
        pm_financial_valuations: true,
      }
    });
  }

  async findByCode(code: string) {
    return await prisma.pmProject.findUnique({
      where: { code }
    });
  }

  async findPlannerProjectsDetailed(plannerId: string, projectIds?: string[]) {
    const projects = await prisma.pmProject.findMany({
      where: buildPlannerProjectsWhere(plannerId, projectIds),
      include: {
        pm_companies: {
          select: {
            id: true,
            name: true,
            taxId: true,
            legalName: true,
            address: true,
            phone: true,
            email: true,
            logoUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        pm_physical_progress: {
          orderBy: { date: 'desc' },
          take: 1,
        },
        pm_obligations: {
          include: { payments: true },
        },
        pm_expenses: true,
        pm_collections: true,
        pm_financial_valuations: true,
      },
      orderBy: [{ pm_companies: { name: 'asc' } }, { code: 'asc' }],
    });

    return projects;
  }

  async findPlannerProjectById(plannerId: string, projectId: string, projectIds?: string[]) {
    const project = await prisma.pmProject.findFirst({
      where: {
        id: projectId,
        ...buildPlannerProjectsWhere(plannerId, projectIds),
      },
      include: {
        pm_companies: {
          select: {
            id: true,
            name: true,
            taxId: true,
            legalName: true,
            address: true,
            phone: true,
            email: true,
            logoUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        pm_users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        pm_physical_progress: {
          orderBy: { date: 'desc' },
        },
        pm_obligations: {
          include: { payments: true },
        },
        pm_expenses: true,
        pm_collections: true,
        pm_financial_valuations: true,
      },
    });

    return project;
  }

  async findProjectByIdDetailed(projectId: string) {
    const project = await prisma.pmProject.findUnique({
      where: { id: projectId },
      include: {
        pm_companies: {
          select: {
            id: true,
            name: true,
            taxId: true,
            legalName: true,
            address: true,
            phone: true,
            email: true,
            logoUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        pm_users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        pm_physical_progress: {
          orderBy: { date: 'desc' },
        },
        pm_obligations: {
          include: { payments: true },
        },
        pm_expenses: true,
        pm_collections: true,
        pm_financial_valuations: true,
      },
    });

    return project;
  }

  async findPlannerProjectsByCompany(plannerId: string, companyId: string, projectIds?: string[]) {
    const projects = await prisma.pmProject.findMany({
      where: {
        companyId,
        ...buildPlannerProjectsWhere(plannerId, projectIds),
      },
      include: {
        pm_companies: {
          select: {
            id: true,
            name: true,
            taxId: true,
            legalName: true,
            address: true,
            phone: true,
            email: true,
            logoUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        pm_physical_progress: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
      orderBy: { code: 'asc' },
    });

    return projects;
  }

  async findPlannerCompanies(plannerId: string, projectIds?: string[]) {
    const companies = await prisma.pmCompany.findMany({
      where: {
        pm_projects: {
          some: buildPlannerProjectsWhere(plannerId, projectIds),
        },
      },
      orderBy: { name: 'asc' },
    });

    return companies;
  }

  async findAllCompanies() {
    return await prisma.pmCompany.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findCompanyById(id: string) {
    return await prisma.pmCompany.findUnique({ where: { id } });
  }

  async findAllProjectsDetailed() {
    const projects = await prisma.pmProject.findMany({
      include: {
        pm_users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        pm_companies: {
          select: {
            id: true,
            name: true,
          },
        },
        pm_financial_valuations: true,
        pm_physical_progress: {
          orderBy: { date: 'desc' },
          take: 1,
        },
        pm_obligations: {
          include: { payments: true },
        },
        pm_expenses: true,
        pm_collections: true,
      },
      orderBy: [{ pm_companies: { name: 'asc' } }, { code: 'asc' }],
    });

    return projects;
  }

  async findProjectsByCompanyDetailed(companyId: string) {
    const projects = await prisma.pmProject.findMany({
      where: { companyId },
      include: {
        pm_financial_valuations: true,
        pm_users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        pm_companies: {
          select: {
            id: true,
            name: true,
            taxId: true,
            legalName: true,
            address: true,
            phone: true,
            email: true,
            logoUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        pm_physical_progress: {
          orderBy: { date: 'desc' },
          take: 1,
        },
        pm_obligations: {
          include: { payments: true },
        },
        pm_expenses: true,
        pm_collections: true,
      },
      orderBy: { code: 'asc' },
    });

    return projects;
  }

  async addExpense(projectId: string, description: string, amountUsd: number, expenseDate?: Date, createdById?: string) {
    return await prisma.pmProjectExpense.create({
      data: {
        projectId,
        description,
        amountUsd,
        expenseDate: expenseDate || new Date(),
        createdById,
      },
    });
  }

  async getExpensesByProject(projectId: string) {
    return await prisma.pmProjectExpense.findMany({
      where: { projectId },
      orderBy: { expenseDate: 'desc' },
    });
  }

  async findExpenseById(id: string) {
    return await prisma.pmProjectExpense.findUnique({
      where: { id },
    });
  }

  async removeExpense(id: string) {
    return await prisma.pmProjectExpense.delete({
      where: { id },
    });
  }

  async updateExpense(id: string, data: { description?: string; amountUsd?: number; expenseDate?: Date }) {
    return await prisma.pmProjectExpense.update({
      where: { id },
      data: {
        ...(data.description !== undefined && { description: data.description }),
        ...(data.amountUsd !== undefined && { amountUsd: data.amountUsd }),
        ...(data.expenseDate !== undefined && { expenseDate: data.expenseDate }),
      },
    });
  }

  async addCollection(
    projectId: string,
    amountUsd: number,
    reference?: string,
    collectedAt?: Date,
    createdById?: string,
    valuationId?: string,
    grossAmountUsd?: number,
    amortizedAmountUsd?: number
  ) {
    return await prisma.pmProjectCollection.create({
      data: {
        projectId,
        amountUsd,
        reference,
        collectedAt: collectedAt || new Date(),
        createdById,
        valuationId: valuationId || null,
        grossAmountUsd: grossAmountUsd !== undefined ? grossAmountUsd : null,
        amortizedAmountUsd: amortizedAmountUsd !== undefined ? amortizedAmountUsd : 0,
      },
      include: {
        valuation: {
          select: {
            id: true,
            valuationNumber: true,
            invoiceNumber: true,
            amountUsd: true,
          },
        },
      },
    });
  }

  async getCollectionsByProject(projectId: string) {
    return await prisma.pmProjectCollection.findMany({
      where: { projectId },
      include: {
        valuation: {
          select: {
            id: true,
            valuationNumber: true,
            invoiceNumber: true,
            amountUsd: true,
          },
        },
      },
      orderBy: { collectedAt: 'desc' },
    });
  }

  async findCollectionById(id: string) {
    return await prisma.pmProjectCollection.findUnique({
      where: { id },
    });
  }

  async removeCollection(id: string) {
    return await prisma.pmProjectCollection.delete({
      where: { id },
    });
  }

  async updateCollection(
    id: string,
    data: {
      amountUsd?: number;
      reference?: string | null;
      collectedAt?: Date;
      valuationId?: string | null;
      grossAmountUsd?: number | null;
      amortizedAmountUsd?: number;
    }
  ) {
    return await prisma.pmProjectCollection.update({
      where: { id },
      data: {
        ...(data.amountUsd !== undefined ? { amountUsd: new Prisma.Decimal(data.amountUsd) } : {}),
        ...(data.reference !== undefined ? { reference: data.reference } : {}),
        ...(data.collectedAt !== undefined ? { collectedAt: data.collectedAt } : {}),
        ...(data.valuationId !== undefined ? { valuationId: data.valuationId } : {}),
        ...(data.grossAmountUsd !== undefined ? { grossAmountUsd: data.grossAmountUsd != null ? new Prisma.Decimal(data.grossAmountUsd) : null } : {}),
        ...(data.amortizedAmountUsd !== undefined ? { amortizedAmountUsd: new Prisma.Decimal(data.amortizedAmountUsd) } : {}),
      },
      include: {
        valuation: {
          select: {
            id: true,
            valuationNumber: true,
            invoiceNumber: true,
            amountUsd: true,
          },
        },
      },
    });
  }
}
