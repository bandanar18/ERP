import { prisma } from '../../../prisma/prisma';
import { buildPlannerProjectsWhere, canPlannerAccessProject } from '../../auth/utils/planner-access';

export interface CreatePhysicalProgressData {
  projectId: string;
  actualProgress: string;
  plannedProgress: string;
  attentionPoints?: string;
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface UpdatePhysicalProgressData {
  actualProgress?: string;
  plannedProgress?: string;
  attentionPoints?: string;
  startDate?: Date | null;
  endDate?: Date | null;
}

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

export class PhysicalProgressRepository {
  /**
   * Obtener todos los avances agrupados por empresa y proyecto
   * plannerId: filtra por managerId / scopes. null: trae todos los proyectos
   */
  async findPlannerProgress(plannerId: string | null, projectIds?: string[]) {
    const where = plannerId ? buildPlannerProjectsWhere(plannerId, projectIds) : undefined;

    const projects = await prisma.pmProject.findMany({
      where,
      include: {
        pm_companies: {
          select: {
            id: true,
            name: true,
          },
        },
        pm_users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        pm_physical_progress: {
          orderBy: {
            date: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        code: 'asc',
      },
    });

    // Agrupar por empresa
    const companyMap = new Map<string, any>();

    for (const project of projects) {
      const companyId = project.pm_companies.id;

      if (!companyMap.has(companyId)) {
        companyMap.set(companyId, {
          companyId: project.pm_companies.id,
          companyName: project.pm_companies.name,
          managers: [],
          projects: [],
        });
      }

      const company = companyMap.get(companyId);

      // Agregar manager si no existe en la lista
      if (project.pm_users && !company.managers.some((m: any) => m.managerId === project.pm_users!.id)) {
        company.managers.push({
          managerId: project.pm_users.id,
          managerName: formatManagerName(project.pm_users),
          managerEmail: project.pm_users.email,
        });
      }

      const lastProgress = project.pm_physical_progress[0] || null;

      company.projects.push({
        projectId: project.id,
        projectCode: project.code,
        projectName: project.fullName,
        shortName: project.shortName,
        status: project.status,
        manager: project.pm_users
          ? {
              managerId: project.pm_users.id,
              managerName: formatManagerName(project.pm_users),
              managerEmail: project.pm_users.email,
            }
          : null,
        lastProgress: lastProgress
          ? {
              id: lastProgress.id,
              date: lastProgress.date,
              actualProgress: lastProgress.actualProgress,
              plannedProgress: lastProgress.plannedProgress,
              attentionPoints: lastProgress.attentionPoints,
              startDate: lastProgress.startDate,
              endDate: lastProgress.endDate,
            }
          : null,
      });
    }

    return Array.from(companyMap.values());
  }

  /**
   * Obtener los últimos avances de una empresa
   * plannerId: filtra por managerId. null: todos los proyectos de la empresa
   */
  async findLatestByCompany(plannerId: string | null, companyId: string, projectIds?: string[]) {
    const projects = await prisma.pmProject.findMany({
      where: {
        companyId,
        ...(plannerId ? buildPlannerProjectsWhere(plannerId, projectIds) : {}),
      },
      include: {
        pm_companies: {
          select: {
            id: true,
            name: true,
          },
        },
        pm_users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        pm_physical_progress: {
          orderBy: {
            date: 'desc',
          },
          take: 1,
        },
      },
    });

    if (projects.length === 0) {
      return null;
    }

    const firstProject = projects[0]!;

    // Obtener managers únicos de todos los proyectos de la empresa
    const managersMap = new Map<string, any>();
    for (const project of projects) {
      if (project.pm_users) {
        const managerId = project.pm_users.id;
        if (!managersMap.has(managerId)) {
          managersMap.set(managerId, {
            managerId: project.pm_users.id,
            managerName: formatManagerName(project.pm_users),
            managerEmail: project.pm_users.email,
          });
        }
      }
    }

    const latestProgress = projects
      .filter((p) => p.pm_physical_progress.length > 0)
      .map((project) => ({
        projectId: project.id,
        projectCode: project.code,
        projectName: project.fullName,
        manager: project.pm_users
          ? {
              managerId: project.pm_users.id,
              managerName: formatManagerName(project.pm_users),
              managerEmail: project.pm_users.email,
            }
          : null,
        progress: {
          id: project.pm_physical_progress[0]!.id,
          date: project.pm_physical_progress[0]!.date,
          actualProgress: project.pm_physical_progress[0]!.actualProgress,
          plannedProgress: project.pm_physical_progress[0]!.plannedProgress,
          attentionPoints: project.pm_physical_progress[0]!.attentionPoints,
          startDate: project.pm_physical_progress[0]!.startDate,
          endDate: project.pm_physical_progress[0]!.endDate,
        },
      }));

    return {
      companyId: firstProject.pm_companies.id,
      companyName: firstProject.pm_companies.name,
      managers: Array.from(managersMap.values()),
      latestProgress,
    };
  }

  /**
   * Obtener todos los avances de un proyecto
   * plannerId: si es provided, verifica que el proyecto pertenezca al planificador
   * null: omite la verificación (admin/gestión)
   */
  async findAllByProject(plannerId: string | null, projectId: string, projectIds?: string[]) {
    const project = await prisma.pmProject.findUnique({
      where: { id: projectId },
      include: {
        pm_companies: {
          select: {
            id: true,
            name: true,
          },
        },
        pm_users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!project) {
      return null;
    }

    // Si es planificador, verificar asignación (managerId o scopes), nunca toda la empresa
    if (plannerId !== null && !canPlannerAccessProject(project, plannerId, projectIds)) {
      return null;
    }

    const progress = await prisma.pmPhysicalProgress.findMany({
      where: { projectId },
      orderBy: { date: 'desc' },
    });

    return {
      projectId: project.id,
      projectCode: project.code,
      projectName: project.fullName,
      companyId: project.companyId,
      manager: project.pm_users
        ? {
            managerId: project.pm_users.id,
            managerName: formatManagerName(project.pm_users),
            managerEmail: project.pm_users.email,
          }
        : null,
      progress: progress.map((p) => ({
        id: p.id,
        date: p.date,
        actualProgress: p.actualProgress,
        plannedProgress: p.plannedProgress,
        attentionPoints: p.attentionPoints,
        startDate: p.startDate,
        endDate: p.endDate,
      })),
    };
  }

  /**
   * Crear un nuevo avance físico
   */
  async create(data: CreatePhysicalProgressData) {
    return await prisma.pmPhysicalProgress.create({
      data: {
        projectId: data.projectId,
        date: new Date(),
        actualProgress: data.actualProgress,
        plannedProgress: data.plannedProgress,
        attentionPoints: data.attentionPoints,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
  }

  /**
   * Actualizar un avance físico existente
   */
  async update(id: string, data: UpdatePhysicalProgressData) {
    return await prisma.pmPhysicalProgress.update({
      where: { id },
      data: {
        ...(data.actualProgress !== undefined && { actualProgress: data.actualProgress }),
        ...(data.plannedProgress !== undefined && { plannedProgress: data.plannedProgress }),
        ...(data.attentionPoints !== undefined && { attentionPoints: data.attentionPoints }),
        ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
      },
    });
  }

  async findById(id: string) {
    return await prisma.pmPhysicalProgress.findUnique({ where: { id } });
  }
}
