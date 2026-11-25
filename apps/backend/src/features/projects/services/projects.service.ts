import { ProjectsRepository } from '../repositories';
import { CreateProjectRequest, UpdateProjectRequest, ProjectResponse } from '../interfaces';
import { AuthError, AuthErrorCode } from '../../auth/interfaces/auth.errors';
import { buildPlannerProjectsWhere } from '../../auth/utils/planner-access';
import { prisma } from '../../../prisma/prisma';
import { Prisma } from '@prisma/client';
import {
  calcActualCost as calcActualCostCentralized,
  calcTotalPayables,
  calcTotalDebt,
} from '../../../modules/project-management/application/services/payables.calc.js';

// Helper para convertir Prisma.Decimal a number
const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && 'toNumber' in value) {
    return (value as Prisma.Decimal).toNumber();
  }
  return Number(value) || 0;
};

/**
 * Construye el nombre visible de un planificador (pm_users) sin mostrar
 * "null null" cuando firstName/lastName faltan: cae al email y, si tampoco,
 * a un texto genérico.
 */
const formatManagerName = (pmUser: any): string => {
  if (!pmUser) return 'No asignado';
  const first = (pmUser.firstName || '').trim();
  const last = (pmUser.lastName || '').trim();
  const name = [first, last].filter(Boolean).join(' ').trim();
  return name || pmUser.email || 'Planificador';
};

const sumAmount = (arr: any[] = []): number =>
  arr.reduce((s: number, x: any) => s + Number(x.amountUsd || 0), 0);

/**
 * Costo Real según criterio de Devengado (Incurridos y Pasivos):
 * Abarca todos los costos comprometidos/incurridos en la obra (obligaciones totales, pagadas o no),
 * más los gastos directos que no se originaron de una obligación (evitando doble conteo).
 */
const calcActualCost = (obligations: any[] = [], expenses: any[] = []): number =>
  calcActualCostCentralized(obligations, expenses);

const getBilledAmount = (valuations: any[] = []): number =>
  valuations
    .filter((v: any) => v.status === 'FACTURADO')
    .reduce((s: number, v: any) => s + Number(v.amountUsd || 0), 0);

const calcPayables = (obligations: any[] = []): number =>
  calcTotalPayables(obligations);

// Helper para convertir un proyecto de Prisma a ProjectResponse
const toProjectResponse = (project: any): ProjectResponse => ({
  id: project.id,
  code: project.code,
  fullName: project.fullName,
  shortName: project.shortName,
  description: project.description,
  managerId: project.managerId,
  companyId: project.companyId,
  startDate: project.startDate ? new Date(project.startDate) : null,
  endDate: project.endDate ? new Date(project.endDate) : null,
  status: project.status,
  offeredAmount: toNumber(project.offeredAmount),
  estimatedCost: toNumber(project.estimatedCost),
  advanceAmount: toNumber(project.advanceAmount),
  amortizedAmount: toNumber(project.amortizedAmount),
  actualCost: calcActualCost(project.pm_obligations, project.pm_expenses),
  collectedAmount: sumAmount(project.pm_collections),
  billedAmount: getBilledAmount(project.pm_financial_valuations),
  cuentasPorPagar: calcPayables(project.pm_obligations),
  financialValuations: (project.pm_financial_valuations || []).map((v: any) => ({
    ...v,
    amountUsd: toNumber(v.amountUsd),
  })),
  createdAt: new Date(project.createdAt),
  updatedAt: new Date(project.updatedAt),
});

export class ProjectsService {
  private readonly repository: ProjectsRepository;

  constructor() {
    this.repository = new ProjectsRepository();
  }

  /**
   * Resuelve el managerId enviado por el frontend al id REAL del usuario del
   * módulo (pm_users).
   *
   * El selector de planificadores usa el endpoint legacy /api/users/role/:role
   * (tabla `users`), por lo que llegan ids del ERP; pero la FK
   * pm_projects.managerId apunta a pm_users.id. Por eso: si el id ya es de
   * pm_users se usa directo; si no, se busca el pm_users cuyo externalId
   * coincide (enlace ERP ↔ módulo).
   */
  private async resolveModuleUserId(managerId: string): Promise<string | null> {
    if (!managerId) return null;

    // Acepta tanto el id de pm_users como el id del ERP legacy (externalId)
    const moduleUser = await prisma.pmModuleUser.findFirst({
      where: {
        OR: [{ id: managerId }, { externalId: managerId }],
      },
      select: { id: true },
    });

    return moduleUser?.id ?? null;
  }

  /**
   * Valida que un usuario sea planificador y devuelve el id real de pm_users.
   *
   * El frontend manda el id del usuario ERP legacy (GET /api/users/role/planificador),
   * así que además de aceptar ids ya resueltos a pm_users, aquí:
   *  - Si el usuario legacy es planificador y NO tiene cuenta en pm_users,
   *    se crea su cuenta del módulo enlazada (externalId) con rol PM_PLANIFICADOR.
   *  - Si tiene cuenta en pm_users pero sin rol de planificador, se le asigna
   *    PM_PLANIFICADOR automáticamente (heredado de su rol legacy).
   */
  private async validateModulePlanner(managerId: string): Promise<string> {
    let moduleUserId = await this.resolveModuleUserId(managerId);

    // 1) Ya existe cuenta en pm_users → validar/heredar rol de planificador
    if (moduleUserId) {
      const moduleUser = await prisma.pmModuleUser.findUnique({
        where: { id: moduleUserId },
        include: {
          pm_user_roles: { include: { pm_roles: true } },
        },
      });

      if (!moduleUser || moduleUser.status !== 'ACTIVE') {
        throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'El planificador no está activo', 400);
      }

      const roleCodes = moduleUser.pm_user_roles.map((r: any) => r.pm_roles?.code);
      if (roleCodes.includes('PM_PLANIFICADOR') || roleCodes.includes('PM_ADMIN')) {
        return moduleUserId;
      }

      // Sin rol de planificador en el módulo: si su cuenta ERP legacy lo es,
      // heredar el rol automáticamente.
      if (moduleUser.externalId) {
        const erpUser = await prisma.erpUser.findUnique({
          where: { id: moduleUser.externalId },
          include: { role: true },
        });
        if (erpUser && this.isErpPlanner(erpUser)) {
          await this.assignModulePlannerRole(moduleUser.id);
          return moduleUserId;
        }
      }

      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'El usuario no es un planificador', 400);
    }

    // 2) No hay cuenta en pm_users → buscar en el ERP legacy y crearla enlazada
    const erpUser = await prisma.erpUser.findUnique({
      where: { id: managerId },
      include: { role: true },
    });

    if (!erpUser || !this.isErpPlanner(erpUser)) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'El usuario no es un planificador', 400);
    }

    if (!erpUser.isActive) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'El planificador no está activo', 400);
    }

    // Reutiliza el hash de password del ERP: el usuario podrá entrar al módulo
    // con la misma contraseña que usa en el ERP.
    const created = await prisma.pmModuleUser.create({
      data: {
        email: erpUser.email.toLowerCase(),
        password: erpUser.password,
        firstName: erpUser.firstName,
        lastName: erpUser.lastName,
        externalId: erpUser.id,
        status: 'ACTIVE',
        emailVerified: erpUser.emailVerified,
      },
    });
    await this.assignModulePlannerRole(created.id);
    return created.id;
  }

  /** Indica si un usuario ERP legacy es planificador (rol planificador/admin/gestión). */
  private isErpPlanner(erpUser: any): boolean {
    const roleName = erpUser.role?.name?.toLowerCase().trim();
    return roleName === 'planificador' || roleName === 'administrador' || roleName === 'gestion';
  }

  /** Asigna el rol PM_PLANIFICADOR a un usuario del módulo (si no lo tiene). */
  private async assignModulePlannerRole(moduleUserId: string): Promise<void> {
    const role = await prisma.pmRole.findUnique({ where: { code: 'PM_PLANIFICADOR' } });
    if (!role) return;

    const existing = await prisma.pmUserRole.findUnique({
      where: {
        userId_roleId: { userId: moduleUserId, roleId: role.id },
      },
    });
    if (existing) return;

    await prisma.pmUserRole.create({
      data: { userId: moduleUserId, roleId: role.id },
    });
  }

  async getAllProjects(companyId: string): Promise<ProjectResponse[]> {
    const projects = await this.repository.findAll(companyId);
    return projects.map(toProjectResponse);
  }

  async getProjectById(id: string, companyId: string): Promise<ProjectResponse> {
    const project = await this.repository.findById(id);

    if (!project) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Proyecto no encontrado', 404);
    }

    if (project.companyId !== companyId) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'No tienes permiso para ver este proyecto', 403);
    }

    return toProjectResponse(project);
  }

  async getProjectByIdSimple(id: string) {
    const project = await this.repository.findById(id);

    if (!project) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Proyecto no encontrado', 404);
    }

    // Mapear último avance físico
    const lastProgress = project.pm_physical_progress?.[0] || null;

    // Objeto company con toda la información
    const companyInfo = project.pm_companies ? {
      id: project.pm_companies.id,
      name: project.pm_companies.name,
      taxId: project.pm_companies.taxId ?? undefined,
      legalName: project.pm_companies.legalName ?? undefined,
      address: project.pm_companies.address ?? undefined,
      phone: project.pm_companies.phone ?? undefined,
      email: project.pm_companies.email ?? undefined,
      logoUrl: project.pm_companies.logoUrl ?? undefined,
    } : undefined;

    const manager = project.pm_users
      ? {
          managerId: project.pm_users.id,
          managerEmail: project.pm_users.email,
          managerName: formatManagerName(project.pm_users),
          phone: project.pm_users.phone || null,
          managerPhone: project.pm_users.phone || null,
        }
      : null;

    // Mapear campos para el frontend
    return {
      ...project,
      projectId: project.id,
      company: companyInfo,
      projectName: project.fullName,
      projectCode: project.code,
      manager,
      lastProgress: lastProgress
        ? {
            id: lastProgress.id,
            date: lastProgress.date,
            actualProgress: lastProgress.actualProgress,
            plannedProgress: lastProgress.plannedProgress,
            attentionPoints: lastProgress.attentionPoints,
          }
        : null,
      actualPhysicalProgress: lastProgress?.actualProgress || (project as any).actualPhysicalProgress || null,
      plannedPhysicalProgress: lastProgress?.plannedProgress || (project as any).plannedPhysicalProgress || null,
      advanceAmount: project.advanceAmount ? Number(project.advanceAmount) : 0,
      amortizedAmount: project.amortizedAmount ? Number(project.amortizedAmount) : 0,
      actualCost: calcActualCost(project.pm_obligations, project.pm_expenses),
      collectedAmount: sumAmount(project.pm_collections),
      billedAmount: getBilledAmount(project.pm_financial_valuations),
      cuentasPorPagar: calcPayables(project.pm_obligations),
      financialValuations: (project.pm_financial_valuations || []).map((v: any) => ({
        ...v,
        amountUsd: toNumber(v.amountUsd),
      })),
    };
  }

  async createProject(data: CreateProjectRequest, companyId: string): Promise<ProjectResponse> {
    const existing = await this.repository.findByCode(data.code);
    if (existing) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Ya existe un proyecto con ese código', 400);
    }

    // Si viene planificador (id legacy ERP o id del módulo), resolver al id real de pm_users
    let managerId: string | null = null;
    if (data.managerId) {
      managerId = await this.validateModulePlanner(data.managerId);
    }

    const createData = {
      ...data,
      status: data.status || 'IN_PROGRESS',
      managerId,
      companyId,
      estimatedCost: new Prisma.Decimal(data.estimatedCost ?? 0)
    };

    const project = await this.repository.create(createData as any);
    return toProjectResponse(project);
  }

  async updateProject(id: string, data: UpdateProjectRequest): Promise<ProjectResponse> {
    const project = await this.repository.findById(id);

    if (!project) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Proyecto no encontrado', 404);
    }

    const updateData = { ...data } as any;
    if (updateData.estimatedCost !== undefined) {
      updateData.estimatedCost = new Prisma.Decimal(updateData.estimatedCost);
    }

    // Si se cambia el planificador, resolver al id real de pm_users
    if (updateData.managerId !== undefined) {
      updateData.managerId = updateData.managerId
        ? await this.validateModulePlanner(updateData.managerId)
        : null;
    }

    const updated = await this.repository.update(id, updateData);
    return toProjectResponse(updated);
  }

  async assignManager(projectId: string, managerId: string): Promise<ProjectResponse> {
    const project = await this.repository.findById(projectId);

    if (!project) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Proyecto no encontrado', 404);
    }

    // Resolver al id real de pm_users y validar rol planificador del módulo
    const moduleUserId = await this.validateModulePlanner(managerId);

    const updated = await this.repository.update(projectId, { managerId: moduleUserId });
    return toProjectResponse(updated);
  }

  async getPlannerProjectsDetailed(plannerId: string, projectIds?: string[]) {
    const projects = await this.repository.findPlannerProjectsDetailed(plannerId, projectIds);

    const detailedProjects = projects.map((project: any) => {
      const lastProgress = project.pm_physical_progress[0] || null;

      // Objeto company con toda la información
      const companyInfo = {
        id: project.pm_companies.id,
        name: project.pm_companies.name,
        taxId: project.pm_companies.taxId ?? undefined,
        legalName: project.pm_companies.legalName ?? undefined,
        address: project.pm_companies.address ?? undefined,
        phone: project.pm_companies.phone ?? undefined,
        email: project.pm_companies.email ?? undefined,
        logoUrl: project.pm_companies.logoUrl ?? undefined,
        createdAt: project.pm_companies.createdAt,
        updatedAt: project.pm_companies.updatedAt,
      };

      return {
        projectId: project.id,
        projectCode: project.code,
        projectName: project.fullName,
        shortName: project.shortName,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        companyId: project.companyId,
        company: companyInfo,
        managerId: project.managerId,
        offeredAmount: project.offeredAmount ? Number(project.offeredAmount) : 0,
        estimatedCost: project.estimatedCost ? Number(project.estimatedCost) : 0,
        advanceAmount: project.advanceAmount ? Number(project.advanceAmount) : 0,
        amortizedAmount: project.amortizedAmount ? Number(project.amortizedAmount) : 0,
        actualCost: calcActualCost(project.pm_obligations, project.pm_expenses),
        collectedAmount: sumAmount(project.pm_collections),
        billedAmount: getBilledAmount(project.pm_financial_valuations),
        cuentasPorPagar: calcPayables(project.pm_obligations),
        lastProgress: lastProgress
          ? {
              id: lastProgress.id,
              date: lastProgress.date,
              actualProgress: lastProgress.actualProgress,
              plannedProgress: lastProgress.plannedProgress,
              attentionPoints: lastProgress.attentionPoints,
            }
          : null,
      };
    });

    const totalProjects = detailedProjects.length;
    const companies = new Set(detailedProjects.map((p: any) => p.companyId));
    const totalCompanies = companies.size;

    const projectsWithProgress = detailedProjects.filter(
      (p: any) => p.lastProgress?.actualProgress != null
    );

    let averageProgress = 0;
    if (projectsWithProgress.length > 0) {
      const sum = projectsWithProgress.reduce((acc: number, p: any) => {
        if (!p.lastProgress?.actualProgress) return acc;
        const rawProgress = p.lastProgress.actualProgress;
        const progress = parseInt(rawProgress.toString().replace('%', ''));
        return acc + (isNaN(progress) ? 0 : progress);
      }, 0);
      averageProgress = Math.round(sum / projectsWithProgress.length);
    }

    return {
      summary: {
        totalProjects,
        totalCompanies,
        averageProgress: `${averageProgress}%`,
        projectsWithProgress: projectsWithProgress.length,
      },
      projects: detailedProjects,
    };
  }

  async getPlannerProjectById(plannerId: string, projectId: string, projectIds?: string[]) {
    const project = await this.repository.findPlannerProjectById(plannerId, projectId, projectIds);

    if (!project) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Proyecto no encontrado o no tienes acceso', 404);
    }

    const detailedProgress = project.pm_physical_progress.map((p: any) => ({
      id: p.id,
      date: p.date,
      actualProgress: p.actualProgress,
      plannedProgress: p.plannedProgress,
      attentionPoints: p.attentionPoints,
    }));

    // Objeto company con toda la información
    const companyInfo = {
      id: project.pm_companies.id,
      name: project.pm_companies.name,
      taxId: project.pm_companies.taxId ?? undefined,
      legalName: project.pm_companies.legalName ?? undefined,
      address: project.pm_companies.address ?? undefined,
      phone: project.pm_companies.phone ?? undefined,
      email: project.pm_companies.email ?? undefined,
      logoUrl: project.pm_companies.logoUrl ?? undefined,
      createdAt: project.pm_companies.createdAt,
      updatedAt: project.pm_companies.updatedAt,
    };

    return {
      projectId: project.id,
      projectCode: project.code,
      projectName: project.fullName,
      shortName: project.shortName,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      companyId: project.companyId,
      company: companyInfo,
      managerId: project.managerId,
      offeredAmount: project.offeredAmount ? Number(project.offeredAmount) : 0,
      estimatedCost: project.estimatedCost ? Number(project.estimatedCost) : 0,
      advanceAmount: project.advanceAmount ? Number(project.advanceAmount) : 0,
      amortizedAmount: project.amortizedAmount ? Number(project.amortizedAmount) : 0,
      actualCost: calcActualCost(project.pm_obligations, project.pm_expenses),
      collectedAmount: sumAmount(project.pm_collections),
      billedAmount: getBilledAmount(project.pm_financial_valuations),
      cuentasPorPagar: calcPayables(project.pm_obligations),
      financialValuations: (project.pm_financial_valuations || []).map((v: any) => ({
        ...v,
        amountUsd: toNumber(v.amountUsd),
      })),
      manager: project.pm_users
        ? {
            managerId: project.pm_users.id,
            managerEmail: project.pm_users.email,
            managerName: formatManagerName(project.pm_users),
            phone: project.pm_users.phone || null,
            managerPhone: project.pm_users.phone || null,
          }
        : null,
      totalProgressRecords: detailedProgress.length,
      lastProgress: detailedProgress[0] || null,
      allProgress: detailedProgress,
    };
  }

  async getProjectByIdForAdmin(projectId: string) {
    const project = await this.repository.findProjectByIdDetailed(projectId);

    if (!project) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Proyecto no encontrado', 404);
    }

    // Mapear todos los avances físicos
    const allProgress = project.pm_physical_progress.map((p: any) => ({
      id: p.id,
      date: p.date,
      actualProgress: p.actualProgress,
      plannedProgress: p.plannedProgress,
      attentionPoints: p.attentionPoints,
    }));

    const lastProgress = allProgress[0] || null;

    // Objeto company con toda la información
    const companyInfo = {
      id: project.pm_companies.id,
      name: project.pm_companies.name,
      taxId: project.pm_companies.taxId ?? undefined,
      legalName: project.pm_companies.legalName ?? undefined,
      address: project.pm_companies.address ?? undefined,
      phone: project.pm_companies.phone ?? undefined,
      email: project.pm_companies.email ?? undefined,
      logoUrl: project.pm_companies.logoUrl ?? undefined,
      createdAt: project.pm_companies.createdAt,
      updatedAt: project.pm_companies.updatedAt,
    };

    return {
      projectId: project.id,
      projectCode: project.code,
      projectName: project.fullName,
      shortName: project.shortName,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      companyId: project.companyId,
      company: companyInfo,
      managerId: project.managerId,
      offeredAmount: project.offeredAmount ? Number(project.offeredAmount) : 0,
      estimatedCost: project.estimatedCost ? Number(project.estimatedCost) : 0,
      advanceAmount: project.advanceAmount ? Number(project.advanceAmount) : 0,
      amortizedAmount: project.amortizedAmount ? Number(project.amortizedAmount) : 0,
      actualCost: calcActualCost(project.pm_obligations, project.pm_expenses),
      collectedAmount: sumAmount(project.pm_collections),
      billedAmount: getBilledAmount(project.pm_financial_valuations),
      cuentasPorPagar: calcPayables(project.pm_obligations),
      financialValuations: (project.pm_financial_valuations || []).map((v: any) => ({
        ...v,
        amountUsd: toNumber(v.amountUsd),
      })),
      manager: project.pm_users
        ? {
            managerId: project.pm_users.id,
            managerEmail: project.pm_users.email,
            managerName: formatManagerName(project.pm_users),
            phone: project.pm_users.phone || null,
            managerPhone: project.pm_users.phone || null,
          }
        : null,
      totalProgressRecords: allProgress.length,
      lastProgress: lastProgress,
      allProgress: allProgress,
    };
  }

  async getPlannerProjectsByCompany(plannerId: string, companyId: string, projectIds?: string[]) {
    const projects = await this.repository.findPlannerProjectsByCompany(plannerId, companyId, projectIds);

    if (projects.length === 0) {
      const company = await prisma.pmCompany.findUnique({ where: { id: companyId } });
      if (!company) {
        throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Empresa no encontrada', 404);
      }
      return {
        company: {
          id: company.id,
          name: company.name,
          taxId: company.taxId ?? undefined,
          legalName: company.legalName ?? undefined,
          address: company.address ?? undefined,
          phone: company.phone ?? undefined,
          email: company.email ?? undefined,
          logoUrl: company.logoUrl ?? undefined,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
        },
        summary: {
          companyId: company.id,
          companyName: company.name,
          totalProjects: 0,
          averageProgress: '0%',
          projectsWithProgress: 0,
        },
        projects: [],
      };
    }

    // Extraer información de la empresa (del primer proyecto)
    const firstProject = projects[0];
    if (!firstProject?.pm_companies) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'No se encontró información de la empresa', 404);
    }

    const companyInfo = {
      id: firstProject.pm_companies.id,
      name: firstProject.pm_companies.name,
      taxId: firstProject.pm_companies.taxId ?? undefined,
      legalName: firstProject.pm_companies.legalName ?? undefined,
      address: firstProject.pm_companies.address ?? undefined,
      phone: firstProject.pm_companies.phone ?? undefined,
      email: firstProject.pm_companies.email ?? undefined,
      logoUrl: firstProject.pm_companies.logoUrl ?? undefined,
      createdAt: firstProject.pm_companies.createdAt,
      updatedAt: firstProject.pm_companies.updatedAt,
    };

    const detailedProjects = projects.map((project: any) => {
      const lastProgress = project.pm_physical_progress[0] || null;
      return {
        projectId: project.id,
        projectCode: project.code,
        projectName: project.fullName,
        shortName: project.shortName,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        companyId: project.companyId,
        companyName: project.pm_companies.name,
        companyTaxId: project.pm_companies.taxId ?? undefined,
        companyLegalName: project.pm_companies.legalName ?? undefined,
        companyAddress: project.pm_companies.address ?? undefined,
        companyPhone: project.pm_companies.phone ?? undefined,
        companyEmail: project.pm_companies.email ?? undefined,
        companyLogoUrl: project.pm_companies.logoUrl ?? undefined,
        managerId: project.managerId,
        offeredAmount: project.offeredAmount ? Number(project.offeredAmount) : 0,
        estimatedCost: project.estimatedCost ? Number(project.estimatedCost) : 0,
        lastProgress: lastProgress
          ? {
              id: lastProgress.id,
              date: lastProgress.date,
              actualProgress: lastProgress.actualProgress,
              plannedProgress: lastProgress.plannedProgress,
              attentionPoints: lastProgress.attentionPoints,
            }
          : null,
      };
    });

    const totalProjects = detailedProjects.length;

    const projectsWithProgress = detailedProjects.filter(
      (p: any) => p.lastProgress?.actualProgress != null
    );

    let averageProgress = 0;
    if (projectsWithProgress.length > 0) {
      const sum = projectsWithProgress.reduce((acc: number, p: any) => {
        if (!p.lastProgress?.actualProgress) return acc;
        const rawProgress = p.lastProgress.actualProgress;
        const progress = parseInt(rawProgress.toString().replace('%', ''));
        return acc + (isNaN(progress) ? 0 : progress);
      }, 0);
      averageProgress = Math.round(sum / projectsWithProgress.length);
    }

    return {
      company: companyInfo,
      summary: {
        companyId: companyInfo.id,
        companyName: companyInfo.name,
        totalProjects,
        averageProgress: `${averageProgress}%`,
        projectsWithProgress: projectsWithProgress.length,
      },
      projects: detailedProjects,
    };
  }

  async getPlannerCompanies(plannerId: string, projectIds?: string[]) {
    const companies = await this.repository.findPlannerCompanies(plannerId, projectIds);

    const companiesWithProjects = await Promise.all(
      companies.map(async (company: any) => {
        const projects = await prisma.pmProject.findMany({
          where: {
            companyId: company.id,
            ...buildPlannerProjectsWhere(plannerId, projectIds),
          },
          include: {
            pm_physical_progress: {
              orderBy: { date: 'desc' },
            },
          },
          orderBy: { code: 'asc' },
        });

        const detailedProjects = projects.map((project: any) => {
          const lastProgress = project.pm_physical_progress[0] || null;
          return {
            projectId: project.id,
            projectCode: project.code,
            projectName: project.fullName,
            shortName: project.shortName,
            description: project.description,
            status: project.status,
            startDate: project.startDate,
            endDate: project.endDate,
            companyId: project.companyId,
            companyName: company.name,
            managerId: project.managerId,
            offeredAmount: project.offeredAmount ? Number(project.offeredAmount) : 0,
            estimatedCost: project.estimatedCost ? Number(project.estimatedCost) : 0,
            advanceAmount: project.advanceAmount ? Number(project.advanceAmount) : 0,
            amortizedAmount: project.amortizedAmount ? Number(project.amortizedAmount) : 0,
            cuentasPorPagar: (project.pm_obligations || []).reduce((sum: number, o: any) => {
              const total = Number(o.amountUsd || 0);
              const paid = (o.payments || []).reduce((pSum: number, p: any) => pSum + Number(p.amountUsd || 0), 0);
              return sum + Math.max(0, total - paid);
            }, 0),
            lastProgress: lastProgress
              ? {
                  id: lastProgress.id,
                  date: lastProgress.date,
                  actualProgress: lastProgress.actualProgress,
                  plannedProgress: lastProgress.plannedProgress,
                  attentionPoints: lastProgress.attentionPoints,
                }
              : null,
          };
        });

        const totalProjects = detailedProjects.length;
        const projectsWithProgress = detailedProjects.filter(
          (p: any) => p.lastProgress?.actualProgress != null
        );

        let averageProgress = 0;
        if (projectsWithProgress.length > 0) {
          const sum = projectsWithProgress.reduce((acc: number, p: any) => {
            if (!p.lastProgress?.actualProgress) return acc;
            const progress = parseInt(p.lastProgress.actualProgress.replace('%', ''));
            return acc + (isNaN(progress) ? 0 : progress);
          }, 0);
          averageProgress = Math.round(sum / projectsWithProgress.length);
        }

        return {
          companyId: company.id,
          companyName: company.name,
          taxId: company.taxId ?? undefined,
          legalName: company.legalName ?? undefined,
          address: company.address ?? undefined,
          phone: company.phone ?? undefined,
          email: company.email ?? undefined,
          logoUrl: company.logoUrl ?? undefined,
          totalProjects,
          averageProgress: `${averageProgress}%`,
          projectsWithProgress: projectsWithProgress.length,
          projects: detailedProjects,
        };
      })
    );

    const totalProjects = companiesWithProjects.reduce(
      (acc: number, company: any) => acc + company.totalProjects,
      0
    );

    return {
      totalCompanies: companiesWithProjects.length,
      totalProjects,
      companies: companiesWithProjects,
    };
  }

  // Métodos para Admin/Gestión
  async getCompanyById(companyId: string) {
    const company = await this.repository.findCompanyById(companyId);
    if (!company) return null;

    const projectsCount = await prisma.pmProject.count({
      where: { companyId: company.id },
    });

    return {
      companyId: company.id,
      companyName: company.name,
      taxId: company.taxId ?? undefined,
      legalName: company.legalName ?? undefined,
      address: company.address ?? undefined,
      phone: company.phone ?? undefined,
      email: company.email ?? undefined,
      logoUrl: company.logoUrl ?? undefined,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      totalProjects: projectsCount,
    };
  }

  async getAllCompanies() {
    const companies = await this.repository.findAllCompanies();

    const companiesWithStats = await Promise.all(
      companies.map(async (company: any) => {
        const projectsCount = await prisma.pmProject.count({
          where: { companyId: company.id },
        });

        return {
          companyId: company.id,
          companyName: company.name,
          taxId: company.taxId ?? undefined,
          legalName: company.legalName ?? undefined,
          address: company.address ?? undefined,
          phone: company.phone ?? undefined,
          email: company.email ?? undefined,
          logoUrl: company.logoUrl ?? undefined,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
          totalProjects: projectsCount,
        };
      })
    );

    return {
      totalCompanies: companiesWithStats.length,
      companies: companiesWithStats,
    };
  }

  async getAllProjectsDetailed() {
    const projects = await this.repository.findAllProjectsDetailed();

    const detailedProjects = projects.map((project: any) => {
      const lastProgress = project.pm_physical_progress[0] || null;

      // Objeto company con toda la información
      const companyInfo = {
        id: project.pm_companies.id,
        name: project.pm_companies.name,
        taxId: project.pm_companies.taxId ?? undefined,
        legalName: project.pm_companies.legalName ?? undefined,
        address: project.pm_companies.address ?? undefined,
        phone: project.pm_companies.phone ?? undefined,
        email: project.pm_companies.email ?? undefined,
        logoUrl: project.pm_companies.logoUrl ?? undefined,
        createdAt: project.pm_companies.createdAt,
        updatedAt: project.pm_companies.updatedAt,
      };

      return {
        projectId: project.id,
        projectCode: project.code,
        projectName: project.fullName,
        shortName: project.shortName,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        companyId: project.companyId,
        company: companyInfo,
        managerId: project.managerId,
        offeredAmount: project.offeredAmount ? Number(project.offeredAmount) : 0,
        estimatedCost: project.estimatedCost ? Number(project.estimatedCost) : 0,
        advanceAmount: project.advanceAmount ? Number(project.advanceAmount) : 0,
        amortizedAmount: project.amortizedAmount ? Number(project.amortizedAmount) : 0,
        manager: project.pm_users
          ? {
              managerId: project.pm_users.id,
              managerEmail: project.pm_users.email,
              managerName: formatManagerName(project.pm_users),
              phone: project.pm_users.phone || null,
              managerPhone: project.pm_users.phone || null,
            }
          : null,
        lastProgress: lastProgress
          ? {
              id: lastProgress.id,
              date: lastProgress.date,
              actualProgress: lastProgress.actualProgress,
              plannedProgress: lastProgress.plannedProgress,
              attentionPoints: lastProgress.attentionPoints,
            }
          : null,
        actualPhysicalProgress: lastProgress?.actualProgress || (project as any).actualPhysicalProgress || null,
        plannedPhysicalProgress: lastProgress?.plannedProgress || (project as any).plannedPhysicalProgress || null,
        actualCost: calcActualCost(project.pm_obligations, project.pm_expenses),
        collectedAmount: sumAmount(project.pm_collections),
        billedAmount: getBilledAmount(project.pm_financial_valuations),
        cuentasPorPagar: calcPayables(project.pm_obligations),
        financialValuations: project.pm_financial_valuations || [],
      };
    });

    const totalProjects = detailedProjects.length;
    const companies = new Set(detailedProjects.map((p: any) => p.companyId));
    const totalCompanies = companies.size;

    const projectsWithManager = detailedProjects.filter((p: any) => p.managerId !== null);
    const projectsWithoutManager = detailedProjects.filter((p: any) => p.managerId === null);

    return {
      summary: {
        totalProjects,
        totalCompanies,
        projectsWithManager: projectsWithManager.length,
        projectsWithoutManager: projectsWithoutManager.length,
      },
      projects: detailedProjects,
    };
  }

  async getProjectsByCompanyDetailed(companyId: string) {
    const projects = await this.repository.findProjectsByCompanyDetailed(companyId);

    if (projects.length === 0) {
      const company = await prisma.pmCompany.findUnique({ where: { id: companyId } });
      if (!company) {
        throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'La empresa no existe', 404);
      }
      return {
        summary: {
          totalProjects: 0,
          totalCompanies: 1,
          projectsWithManager: 0,
          projectsWithoutManager: 0,
        },
        projects: [],
        company: {
          id: company.id,
          name: company.name,
          taxId: company.taxId ?? undefined,
          legalName: company.legalName ?? undefined,
          address: company.address ?? undefined,
          phone: company.phone ?? undefined,
          email: company.email ?? undefined,
          logoUrl: company.logoUrl ?? undefined,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
        },
      };
    }

    // Extraer información de la empresa (del primer proyecto)
    const firstProject = projects[0];
    if (!firstProject?.pm_companies) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'No se encontró información de la empresa', 404);
    }

    const companyInfo = {
      id: firstProject.pm_companies.id,
      name: firstProject.pm_companies.name,
      taxId: firstProject.pm_companies.taxId ?? undefined,
      legalName: firstProject.pm_companies.legalName ?? undefined,
      address: firstProject.pm_companies.address ?? undefined,
      phone: firstProject.pm_companies.phone ?? undefined,
      email: firstProject.pm_companies.email ?? undefined,
      logoUrl: firstProject.pm_companies.logoUrl ?? undefined,
      createdAt: firstProject.pm_companies.createdAt,
      updatedAt: firstProject.pm_companies.updatedAt,
    };

    const detailedProjects = projects.map((project: any) => {
      const lastProgress = project.pm_physical_progress[0] || null;

      // Objeto company para cada proyecto
      const projectCompanyInfo = {
        id: project.pm_companies.id,
        name: project.pm_companies.name,
        taxId: project.pm_companies.taxId ?? undefined,
        legalName: project.pm_companies.legalName ?? undefined,
        address: project.pm_companies.address ?? undefined,
        phone: project.pm_companies.phone ?? undefined,
        email: project.pm_companies.email ?? undefined,
        logoUrl: project.pm_companies.logoUrl ?? undefined,
      };

      return {
        projectId: project.id,
        projectCode: project.code,
        projectName: project.fullName,
        shortName: project.shortName,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        companyId: project.companyId,
        company: projectCompanyInfo,
        managerId: project.managerId,
        offeredAmount: project.offeredAmount ? Number(project.offeredAmount) : 0,
        estimatedCost: project.estimatedCost ? Number(project.estimatedCost) : 0,
        advanceAmount: project.advanceAmount ? Number(project.advanceAmount) : 0,
        amortizedAmount: project.amortizedAmount ? Number(project.amortizedAmount) : 0,
        manager: project.pm_users
          ? {
              managerId: project.pm_users.id,
              managerEmail: project.pm_users.email,
              managerName: formatManagerName(project.pm_users),
              phone: project.pm_users.phone || null,
              managerPhone: project.pm_users.phone || null,
            }
          : null,
        financialValuations: project.pm_financial_valuations || [],
        lastProgress: lastProgress
          ? {
              id: lastProgress.id,
              date: lastProgress.date,
              actualProgress: lastProgress.actualProgress,
              plannedProgress: lastProgress.plannedProgress,
              attentionPoints: lastProgress.attentionPoints,
            }
          : null,
        actualPhysicalProgress: lastProgress?.actualProgress || (project as any).actualPhysicalProgress || null,
        plannedPhysicalProgress: lastProgress?.plannedProgress || (project as any).plannedPhysicalProgress || null,
        actualCost: calcActualCost(project.pm_obligations, project.pm_expenses),
        collectedAmount: sumAmount(project.pm_collections),
        billedAmount: getBilledAmount(project.pm_financial_valuations),
        cuentasPorPagar: calcPayables(project.pm_obligations),
      };
    });

    const totalProjects = detailedProjects.length;
    const projectsWithManager = detailedProjects.filter((p: any) => p.managerId !== null);
    const projectsWithoutManager = detailedProjects.filter((p: any) => p.managerId === null);

    return {
      company: companyInfo,
      summary: {
        companyId: companyInfo.id,
        companyName: companyInfo.name,
        totalProjects,
        projectsWithManager: projectsWithManager.length,
        projectsWithoutManager: projectsWithoutManager.length,
      },
      projects: detailedProjects,
    };
  }

  async updateAdvance(projectId: string, advanceAmount: number, amortizedAmount: number) {
    const project = await prisma.pmProject.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Proyecto no encontrado', 404);
    }

    const updated = await prisma.pmProject.update({
      where: { id: projectId },
      data: {
        advanceAmount,
        amortizedAmount,
      },
    });

    return {
      id: updated.id,
      advanceAmount: Number(updated.advanceAmount),
      amortizedAmount: Number(updated.amortizedAmount),
    };
  }

  async addExpense(projectId: string, description: string, amountUsd: number, expenseDate?: string, createdById?: string) {
    if (!description?.trim()) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'La descripción del gasto es requerida', 400);
    }
    const amt = Number(amountUsd);
    if (isNaN(amt) || amt <= 0) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'El monto debe ser mayor a 0', 400);
    }
    const date = expenseDate ? new Date(expenseDate) : new Date();
    return await this.repository.addExpense(projectId, description.trim(), amt, date, createdById);
  }

  async getExpenses(projectId: string) {
    const expenses = await this.repository.getExpensesByProject(projectId);
    return expenses.map((e) => ({
      ...e,
      amountUsd: Number(e.amountUsd),
    }));
  }

  async removeExpense(id: string, userRole?: string, userProjectIds?: string[]) {
    const expense = await this.repository.findExpenseById(id);
    if (!expense) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Gasto no encontrado', 404);
    }

    if (expense.obligationPaymentId) {
      throw new AuthError(
        AuthErrorCode.INTERNAL_ERROR,
        'Este gasto proviene del pago de una obligación. Para anularlo, revierte el pago en la sección de Obligaciones.',
        400
      );
    }

    if (userRole === 'admin_financiero' && userProjectIds && userProjectIds.length > 0) {
      if (!userProjectIds.includes(expense.projectId)) {
        throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'No tienes asignado este proyecto', 403);
      }
    }

    return await this.repository.removeExpense(id);
  }

  async updateExpense(
    id: string,
    data: { description?: string; amountUsd?: number; expenseDate?: string },
    userRole?: string,
    userProjectIds?: string[]
  ) {
    const expense = await this.repository.findExpenseById(id);
    if (!expense) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Gasto no encontrado', 404);
    }

    if (expense.obligationPaymentId) {
      throw new AuthError(
        AuthErrorCode.INTERNAL_ERROR,
        'No se puede editar un desembolso originado desde una obligación. Modifícalo desde Cuentas por Pagar.',
        400
      );
    }

    if (userRole === 'admin_financiero' && userProjectIds && userProjectIds.length > 0) {
      if (!userProjectIds.includes(expense.projectId)) {
        throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'No tienes asignado este proyecto', 403);
      }
    }

    let amt: number | undefined;
    if (data.amountUsd !== undefined) {
      amt = Number(data.amountUsd);
      if (isNaN(amt) || amt <= 0) {
        throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'El monto debe ser mayor a 0', 400);
      }
    }

    return await this.repository.updateExpense(id, {
      description: data.description !== undefined ? data.description.trim() : undefined,
      amountUsd: amt,
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : undefined,
    });
  }

  async addCollection(
    projectId: string,
    amountUsd: number,
    reference?: string,
    collectedAt?: string,
    createdById?: string,
    valuationId?: string,
    grossAmountUsd?: number,
    amortizedAmountUsd?: number
  ) {
    const amt = Number(amountUsd);
    if (isNaN(amt) || amt <= 0) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'El monto neto cobrado debe ser mayor a 0', 400);
    }
    const amort = amortizedAmountUsd !== undefined ? Number(amortizedAmountUsd) : 0;
    if (isNaN(amort) || amort < 0) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'La amortización no puede ser negativa', 400);
    }
    const gross = (grossAmountUsd !== undefined && grossAmountUsd !== null && !isNaN(Number(grossAmountUsd)) && Number(grossAmountUsd) > 0)
      ? Number(grossAmountUsd)
      : undefined;
    if (gross !== undefined && gross < amt) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'El monto bruto no puede ser menor que el monto neto cobrado', 400);
    }

    const trimmedValuationId = (valuationId && typeof valuationId === 'string' && valuationId.trim().length > 0)
      ? valuationId.trim()
      : undefined;

    if (trimmedValuationId) {
      const valuation = await prisma.pmFinancialValuation.findUnique({
        where: { id: trimmedValuationId },
      });
      if (!valuation) {
        throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Valuación no encontrada', 404);
      }
      if (valuation.projectId !== projectId) {
        throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'La valuación no pertenece a este proyecto', 400);
      }
      if (valuation.status !== 'FACTURADO') {
        throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Solo se pueden liquidar valuaciones con estado FACTURADO', 400);
      }
      const existingCollection = await prisma.pmProjectCollection.findFirst({
        where: { valuationId: trimmedValuationId },
      });
      if (existingCollection) {
        throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Esta valuación ya tiene un cobro registrado', 400);
      }
    }

    const date = collectedAt ? new Date(collectedAt) : new Date();

    if (amort > 0) {
      return await prisma.$transaction(async (tx) => {
        const project = await tx.pmProject.findUnique({ where: { id: projectId } });
        if (!project) {
          throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Proyecto no encontrado', 404);
        }
        const currentAdvance = Number(project.advanceAmount || 0);
        const currentAmortized = Number(project.amortizedAmount || 0);
        const newAmortized = currentAmortized + amort;
        const updatedAdvance = Math.max(currentAdvance, newAmortized);

        await tx.pmProject.update({
          where: { id: projectId },
          data: {
            amortizedAmount: new Prisma.Decimal(newAmortized),
            advanceAmount: new Prisma.Decimal(updatedAdvance),
          },
        });

        return await tx.pmProjectCollection.create({
          data: {
            projectId,
            amountUsd: new Prisma.Decimal(amt),
            reference: reference?.trim() || null,
            collectedAt: date,
            createdById,
            valuationId: trimmedValuationId || null,
            grossAmountUsd: gross !== undefined ? new Prisma.Decimal(gross) : null,
            amortizedAmountUsd: new Prisma.Decimal(amort),
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
      });
    }

    return await this.repository.addCollection(
      projectId,
      amt,
      reference?.trim() || undefined,
      date,
      createdById,
      trimmedValuationId,
      gross,
      amort
    );
  }

  async getCollections(projectId: string) {
    const collections = await this.repository.getCollectionsByProject(projectId);
    return collections.map((c: any) => ({
      ...c,
      amountUsd: Number(c.amountUsd),
      grossAmountUsd: c.grossAmountUsd ? Number(c.grossAmountUsd) : null,
      amortizedAmountUsd: c.amortizedAmountUsd ? Number(c.amortizedAmountUsd) : 0,
    }));
  }

  async removeCollection(id: string, userRole?: string, userProjectIds?: string[]) {
    const collection = await this.repository.findCollectionById(id);
    if (!collection) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Cobro no encontrado', 404);
    }

    if (userRole === 'admin_financiero' && userProjectIds && userProjectIds.length > 0) {
      if (!userProjectIds.includes(collection.projectId)) {
        throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'No tienes asignado este proyecto', 403);
      }
    }

    const amort = Number(collection.amortizedAmountUsd || 0);
    if (amort > 0) {
      return await prisma.$transaction(async (tx) => {
        const project = await tx.pmProject.findUnique({ where: { id: collection.projectId } });
        if (project) {
          const currentAmortized = Number(project.amortizedAmount || 0);
          const updatedAmortized = Math.max(0, currentAmortized - amort);
          await tx.pmProject.update({
            where: { id: collection.projectId },
            data: { amortizedAmount: new Prisma.Decimal(updatedAmortized) },
          });
        }
        return await tx.pmProjectCollection.delete({ where: { id } });
      });
    }

    return await this.repository.removeCollection(id);
  }

  async updateCollection(
    id: string,
    data: {
      amountUsd?: number;
      reference?: string | null;
      collectedAt?: string;
      valuationId?: string | null;
      grossAmountUsd?: number | null;
      amortizedAmountUsd?: number;
    },
    userRole?: string,
    userProjectIds?: string[]
  ) {
    const collection = await this.repository.findCollectionById(id);
    if (!collection) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Cobro no encontrado', 404);
    }

    if (userRole === 'admin_financiero' && userProjectIds && userProjectIds.length > 0) {
      if (!userProjectIds.includes(collection.projectId)) {
        throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'No tienes asignado este proyecto', 403);
      }
    }

    let amt = Number(collection.amountUsd);
    if (data.amountUsd !== undefined) {
      amt = Number(data.amountUsd);
      if (isNaN(amt) || amt <= 0) {
        throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'El monto neto cobrado debe ser mayor a 0', 400);
      }
    }

    let amort = Number(collection.amortizedAmountUsd || 0);
    if (data.amortizedAmountUsd !== undefined) {
      amort = Number(data.amortizedAmountUsd);
      if (isNaN(amort) || amort < 0) {
        throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'La amortización no puede ser negativa', 400);
      }
    }

    let gross: number | null | undefined = collection.grossAmountUsd ? Number(collection.grossAmountUsd) : null;
    if (data.grossAmountUsd !== undefined) {
      gross = data.grossAmountUsd !== null && data.grossAmountUsd !== undefined
        ? Number(data.grossAmountUsd)
        : null;
      if (gross !== null && (isNaN(gross) || gross < 0)) {
        throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'El monto bruto no puede ser negativo', 400);
      }
    }

    if (gross !== null && gross !== undefined && gross < amt) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'El monto bruto no puede ser menor que el monto neto cobrado', 400);
    }
    if (gross !== null && gross !== undefined && amort > 0 && gross < (amt + amort - 0.01)) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'El monto bruto debe ser al menos la suma del neto y la amortización', 400);
    }

    let valuationIdToSet: string | null = collection.valuationId;
    if (data.valuationId !== undefined) {
      const trimmedValId = (data.valuationId && typeof data.valuationId === 'string' && data.valuationId.trim().length > 0)
        ? data.valuationId.trim()
        : null;
      if (trimmedValId && trimmedValId !== collection.valuationId) {
        const valuation = await prisma.pmFinancialValuation.findUnique({
          where: { id: trimmedValId },
        });
        if (!valuation) {
          throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Valuación no encontrada', 404);
        }
        if (valuation.projectId !== collection.projectId) {
          throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'La valuación no pertenece a este proyecto', 400);
        }
        if (valuation.status !== 'FACTURADO') {
          throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Solo se pueden liquidar valuaciones con estado FACTURADO', 400);
        }
        const existingCollection = await prisma.pmProjectCollection.findFirst({
          where: { valuationId: trimmedValId, id: { not: id } },
        });
        if (existingCollection) {
          throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Esta valuación ya tiene otro cobro registrado', 400);
        }
      }
      valuationIdToSet = trimmedValId;
    }

    const date = data.collectedAt ? new Date(data.collectedAt) : collection.collectedAt;
    const ref = data.reference !== undefined ? (data.reference?.trim() || null) : collection.reference;

    const oldAmort = Number(collection.amortizedAmountUsd || 0);
    const diffAmort = amort - oldAmort;

    return await prisma.$transaction(async (tx) => {
      if (diffAmort !== 0) {
        const project = await tx.pmProject.findUnique({ where: { id: collection.projectId } });
        if (project) {
          const currentAmortized = Number(project.amortizedAmount || 0);
          const updatedAmortized = Math.max(0, currentAmortized + diffAmort);
          const currentAdvance = Number(project.advanceAmount || 0);
          const updatedAdvance = Math.max(currentAdvance, updatedAmortized);
          await tx.pmProject.update({
            where: { id: collection.projectId },
            data: {
              amortizedAmount: new Prisma.Decimal(updatedAmortized),
              advanceAmount: new Prisma.Decimal(updatedAdvance),
            },
          });
        }
      }

      const updated = await tx.pmProjectCollection.update({
        where: { id },
        data: {
          amountUsd: new Prisma.Decimal(amt),
          reference: ref,
          collectedAt: date,
          valuationId: valuationIdToSet,
          grossAmountUsd: gross !== null && gross !== undefined ? new Prisma.Decimal(gross) : null,
          amortizedAmountUsd: new Prisma.Decimal(amort),
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

      return {
        ...updated,
        amountUsd: Number(updated.amountUsd),
        grossAmountUsd: updated.grossAmountUsd ? Number(updated.grossAmountUsd) : null,
        amortizedAmountUsd: updated.amortizedAmountUsd ? Number(updated.amortizedAmountUsd) : 0,
      };
    });
  }

  async transferProjects(sourceCompanyId: string, targetCompanyId: string, projectIds: string[]) {
    if (!sourceCompanyId || !targetCompanyId || !Array.isArray(projectIds) || projectIds.length === 0) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Datos de traslado incompletos', 400);
    }

    const uniqueIds = [...new Set(projectIds.filter((id) => typeof id === 'string' && id.trim()))];
    if (uniqueIds.length === 0) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Selecciona al menos un proyecto', 400);
    }

    if (sourceCompanyId === targetCompanyId) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'La empresa de destino debe ser distinta de la origen', 400);
    }

    const [source, target] = await Promise.all([
      prisma.pmCompany.findUnique({ where: { id: sourceCompanyId }, select: { id: true, name: true } }),
      prisma.pmCompany.findUnique({ where: { id: targetCompanyId }, select: { id: true, name: true } }),
    ]);

    if (!source) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'La empresa de origen no existe', 404);
    }
    if (!target) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'La empresa de destino no existe', 404);
    }

    const projects = await prisma.pmProject.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, companyId: true, fullName: true, code: true },
    });

    if (projects.length !== uniqueIds.length) {
      throw new AuthError(AuthErrorCode.INTERNAL_ERROR, 'Uno o más proyectos no existen', 404);
    }

    const foreign = projects.filter((project) => project.companyId !== sourceCompanyId);
    if (foreign.length > 0) {
      throw new AuthError(
        AuthErrorCode.INTERNAL_ERROR,
        'Algunos proyectos ya no pertenecen a la empresa de origen',
        409
      );
    }

    await prisma.$transaction(
      uniqueIds.map((id) =>
        prisma.pmProject.update({
          where: { id },
          data: { companyId: targetCompanyId },
        })
      )
    );

    return {
      transferred: uniqueIds.length,
      sourceCompanyId,
      sourceCompanyName: source.name,
      targetCompanyId,
      targetCompanyName: target.name,
      projects: projects.map((project) => ({
        id: project.id,
        code: project.code,
        fullName: project.fullName,
      })),
    };
  }
}

