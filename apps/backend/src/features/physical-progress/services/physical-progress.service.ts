import { PhysicalProgressRepository, CreatePhysicalProgressData, UpdatePhysicalProgressData } from '../repositories';
import { PlannerProgressResponse, CompanyLatestProgress, ProjectAllProgressResponse } from '../interfaces';
import { PhysicalProgressError } from '../interfaces/physical-progress.errors';
import { canPlannerAccessProject } from '../../auth/utils/planner-access';
import { prisma } from '../../../prisma/prisma';

export class PhysicalProgressService {
  private readonly repository: PhysicalProgressRepository;

  constructor() {
    this.repository = new PhysicalProgressRepository();
  }

  /**
   * Caso 1: Obtener todos los avances
   * Planificador: solo sus proyectos agrupados por empresa
   * Admin/Gestión: todos los proyectos agrupados por empresa
   */
  async getPlannerProgress(plannerId: string, roleName: string, projectIds?: string[]): Promise<PlannerProgressResponse> {
    const isAdminOrGestion = this.isAdminOrGestion(roleName);
    const companies = await this.repository.findPlannerProgress(
      isAdminOrGestion ? null : plannerId,
      isAdminOrGestion ? undefined : projectIds
    );
    return { companies };
  }

  /**
   * Caso 2: Obtener últimos avances de una empresa
   * Planificador: solo sus proyectos de esa empresa
   * Admin/Gestión: todos los proyectos de esa empresa
   */
  async getLatestByCompany(
    plannerId: string,
    roleName: string,
    companyId: string,
    projectIds?: string[]
  ): Promise<CompanyLatestProgress | null> {
    const isAdminOrGestion = this.isAdminOrGestion(roleName);
    const result = await this.repository.findLatestByCompany(
      isAdminOrGestion ? null : plannerId,
      companyId,
      isAdminOrGestion ? undefined : projectIds
    );

    if (!result) {
      throw PhysicalProgressError.noProjectsFound();
    }

    return result;
  }

  /**
   * Caso 3: Obtener todos los avances de un proyecto
   * Planificador: solo si lo tiene asignado
   * Admin/Gestión: cualquier proyecto
   */
  async getProjectProgress(
    plannerId: string,
    roleName: string,
    projectId: string,
    userCompanyId?: string,
    projectIds?: string[]
  ): Promise<ProjectAllProgressResponse | null> {
    const isAdminOrGestion = this.isAdminOrGestion(roleName);
    const isDireccion = roleName.toLowerCase() === 'direccion';

    const result = await this.repository.findAllByProject(
      (isAdminOrGestion || isDireccion) ? null : plannerId,
      projectId,
      projectIds
    );

    if (!result) {
      throw PhysicalProgressError.projectNotFoundOrUnauthorized();
    }

    // Si es direccion, verificar que el proyecto pertenezca a su empresa
    if (isDireccion && result.companyId !== userCompanyId) {
      throw PhysicalProgressError.projectNotFoundOrUnauthorized();
    }

    return result;
  }

  /**
   * Helper: verifica si el rol es admin o gestión
   */
  private isAdminOrGestion(roleName: string): boolean {
    const normalized = roleName?.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    return normalized === 'administrador' || normalized === 'gestion' || normalized === 'gestión';
  }

  /**
   * Crear un nuevo avance físico
   * Solo planificadores pueden crear avances para proyectos asignados (managerId o scopes)
   */
  async create(data: CreatePhysicalProgressData, userId: string, roleName: string, projectIds?: string[]) {
    // Verificar que el proyecto existe
    const project = await prisma.pmProject.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw PhysicalProgressError.projectNotFoundOrUnauthorized();
    }

    if (!this.isAdminOrGestion(roleName) && !canPlannerAccessProject(project, userId, projectIds)) {
      throw PhysicalProgressError.projectNotFoundOrUnauthorized();
    }

    return await this.repository.create(data);
  }

  /**
   * Actualizar un avance físico existente
   * Solo planificadores pueden editar avances de proyectos asignados (managerId o scopes)
   */
  async update(id: string, data: UpdatePhysicalProgressData, userId: string, roleName: string, projectIds?: string[]) {
    const progress = await this.repository.findById(id);

    if (!progress) {
      throw PhysicalProgressError.projectNotFoundOrUnauthorized();
    }

    const project = await prisma.pmProject.findUnique({
      where: { id: progress.projectId },
    });

    if (!project) {
      throw PhysicalProgressError.projectNotFoundOrUnauthorized();
    }

    if (!this.isAdminOrGestion(roleName) && !canPlannerAccessProject(project, userId, projectIds)) {
      throw PhysicalProgressError.projectNotFoundOrUnauthorized();
    }

    return await this.repository.update(id, data);
  }

}
