import { Response } from 'express';
import { ProjectsService } from '../services';
import { AuthRequest } from '../../auth/middleware/auth.middleware';
import { TokenPayload } from '../../auth/interfaces';
import { AuthErrorCode } from '../../auth/interfaces/auth.errors';
import { canPlannerAccessProject } from '../../auth/utils/planner-access';

export class ProjectsController {
  private readonly service: ProjectsService;

  constructor() {
    this.service = new ProjectsService();
  }

  getAll = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId, companyId, roleName, pmUserId, projectIds } = req.user as TokenPayload;

      if (roleName === 'admin_financiero') {
        const ids = new Set(projectIds ?? []);
        const all: any = await this.service.getAllProjectsDetailed();
        let projectsList = Array.isArray(all) ? all : (all.projects ?? []);
        if (ids.size > 0) {
          projectsList = projectsList.filter((p: any) => ids.has(p.projectId || p.id));
        } else if (companyId) {
          projectsList = projectsList.filter((p: any) => (p.companyId || p.company?.id) === companyId);
        }
        if (Array.isArray(all)) {
          res.status(200).json(projectsList);
        } else {
          res.status(200).json({
            ...all,
            projects: projectsList,
            summary: {
              ...all.summary,
              totalProjects: projectsList.length,
            },
          });
        }
        return;
      }

      if (roleName === 'planificador') {
        // Los proyectos del planificador se filtran por managerId (pm_users.id)
        // y/o por projectIds de scopes. Tener companyId NO abre toda la empresa.
        const plannerId = pmUserId ?? userId;
        if (!plannerId) {
          res.status(400).json({ error: 'Usuario no válido', code: AuthErrorCode.INTERNAL_ERROR });
          return;
        }
        const result = await this.service.getPlannerProjectsDetailed(plannerId, projectIds);
        res.status(200).json(result);
        return;
      }

      if (roleName === 'direccion') {
        if (!companyId) {
          res.status(403).json({ error: 'El usuario de dirección no tiene una empresa asignada', code: AuthErrorCode.INTERNAL_ERROR });
          return;
        }
        const result = await this.service.getProjectsByCompanyDetailed(String(companyId));
        res.status(200).json(result);
        return;
      }

      // Admin/Gestión - todos los proyectos con detalles
      const result = await this.service.getAllProjectsDetailed();
      res.status(200).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor',
        code: error.code || AuthErrorCode.INTERNAL_ERROR
      });
    }
  };

  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { userId, companyId, roleName, pmUserId, projectIds } = req.user as TokenPayload;

      if (!id || typeof id !== 'string') {
        res.status(400).json({ error: 'ID de proyecto no válido', code: AuthErrorCode.INTERNAL_ERROR });
        return;
      }

      if (roleName === 'admin_financiero') {
        const ids = projectIds ?? [];
        if (ids.length > 0 && !ids.includes(id)) {
          res.status(403).json({ error: 'No tienes asignado este proyecto' });
          return;
        }
      }

      // Planificador: ver detalles completos con todos los avances
      if (roleName === 'planificador') {
        const plannerId = pmUserId ?? userId;
        if (!plannerId) {
          res.status(400).json({ error: 'Usuario no válido', code: AuthErrorCode.INTERNAL_ERROR });
          return;
        }
        const result = await this.service.getPlannerProjectById(plannerId, id, projectIds);
        res.status(200).json(result);
        return;
      }

      const normalizedRole = roleName?.toLowerCase().trim();

      if (normalizedRole === 'direccion') {
        if (!companyId) {
          res.status(403).json({ error: 'El usuario de dirección no tiene una empresa asignada', code: AuthErrorCode.INTERNAL_ERROR });
          return;
        }
        const project = await this.service.getProjectByIdForAdmin(id);
        if (!project || String(project.companyId) !== String(companyId)) {
          res.status(403).json({ error: 'No tienes permiso para ver este proyecto' });
          return;
        }
        res.status(200).json(project);
        return;
      }

      // Admin/Gestión: ver proyecto sin validar companyId (pueden ver todos)
      const project = await this.service.getProjectByIdForAdmin(id);
      res.status(200).json(project);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor',
        code: error.code || AuthErrorCode.INTERNAL_ERROR
      });
    }
  };

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { companyId } = req.body;

      if (!companyId) {
        res.status(400).json({ error: 'El proyecto debe estar asociado a una empresa', code: AuthErrorCode.INTERNAL_ERROR });
        return;
      }

      const project = await this.service.createProject(req.body, companyId);
      res.status(201).json(project);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor',
        code: error.code || AuthErrorCode.INTERNAL_ERROR
      });
    }
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        res.status(400).json({ error: 'ID de proyecto no válido', code: AuthErrorCode.INTERNAL_ERROR });
        return;
      }

      // Obtener el proyecto actual para verificar permisos
      const existingProject = await this.service.getProjectByIdSimple(id);
      if (!existingProject) {
        res.status(404).json({ error: 'Proyecto no encontrado', code: AuthErrorCode.INTERNAL_ERROR });
        return;
      }

      // Planificadores solo pueden editar proyectos asignados (managerId o scopes)
      const { roleName, userId, pmUserId, projectIds } = req.user as TokenPayload;
      const plannerId = pmUserId ?? userId;
      if (roleName === 'planificador') {
        if (!plannerId || !canPlannerAccessProject(existingProject, plannerId, projectIds)) {
          res.status(403).json({ error: 'No tienes permiso para editar este proyecto', code: AuthErrorCode.INTERNAL_ERROR });
          return;
        }
      }

      const project = await this.service.updateProject(id, req.body);
      res.status(200).json(project);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor',
        code: error.code || AuthErrorCode.INTERNAL_ERROR
      });
    }
  };

  getPlannerProjectsByCompany = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId, pmUserId, projectIds } = req.user as TokenPayload;
      const { companyId } = req.params;

      const plannerId = pmUserId ?? userId;
      if (!plannerId || !companyId) {
        res.status(400).json({ error: 'Parámetros no válidos', code: AuthErrorCode.INTERNAL_ERROR });
        return;
      }

      const result = await this.service.getPlannerProjectsByCompany(plannerId, String(companyId), projectIds);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor',
        code: error.code || AuthErrorCode.INTERNAL_ERROR
      });
    }
  };

  getPlannerCompanies = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId, pmUserId, projectIds } = req.user as TokenPayload;

      const plannerId = pmUserId ?? userId;
      if (!plannerId) {
        res.status(400).json({ error: 'Usuario no válido', code: AuthErrorCode.INTERNAL_ERROR });
        return;
      }

      const result = await this.service.getPlannerCompanies(plannerId, projectIds);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor',
        code: error.code || AuthErrorCode.INTERNAL_ERROR
      });
    }
  };

  getCompanies = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId, roleName, pmUserId, companyId, projectIds } = req.user as TokenPayload;
      const normalizedRole = roleName?.toLowerCase().trim();

      if (normalizedRole === 'planificador') {
        const plannerId = pmUserId ?? userId;
        if (!plannerId) {
          res.status(400).json({ error: 'Usuario no válido', code: AuthErrorCode.INTERNAL_ERROR });
          return;
        }
        const result = await this.service.getPlannerCompanies(plannerId, projectIds);
        res.status(200).json(result);
        return;
      }

      if (normalizedRole === 'direccion') {
        // Direccion solo ve su propia empresa (la asignada via scopes)
        const { companyId } = req.user as TokenPayload;
        if (!companyId) {
          res.status(403).json({ error: 'No tienes una empresa asignada', code: AuthErrorCode.INTERNAL_ERROR });
          return;
        }
        const result = await this.service.getCompanyById(companyId);
        if (!result) {
          res.status(404).json({ error: 'Empresa no encontrada', code: AuthErrorCode.INTERNAL_ERROR });
          return;
        }
        // Retornar en el mismo formato que getAllCompanies para el frontend
        res.status(200).json({ totalCompanies: 1, companies: [result] });
        return;
      }

      if (normalizedRole === 'admin_financiero' && companyId) {
        const result = await this.service.getCompanyById(companyId);
        if (result) {
          res.status(200).json({ totalCompanies: 1, companies: [result] });
          return;
        }
      }

      // Admin/Gestión/Admin Financiero
      const result = await this.service.getAllCompanies();
      res.status(200).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor',
        code: error.code || AuthErrorCode.INTERNAL_ERROR
      });
    }
  };

  // Redirección según rol para /company/:id
  getProjectsByCompany = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId, roleName, companyId: userCompanyId, pmUserId, projectIds } = req.user as TokenPayload;
      const { companyId } = req.params;
      const normalizedRole = roleName?.toLowerCase().trim();

      if (!companyId) {
        res.status(400).json({ error: 'ID de compañía no válido', code: AuthErrorCode.INTERNAL_ERROR });
        return;
      }

      if (normalizedRole === 'planificador') {
        const plannerId = pmUserId ?? userId;
        if (!plannerId) {
          res.status(400).json({ error: 'Usuario no válido', code: AuthErrorCode.INTERNAL_ERROR });
          return;
        }
        const result = await this.service.getPlannerProjectsByCompany(plannerId, String(companyId), projectIds);
        res.status(200).json(result);
        return;
      }

      if (normalizedRole === 'direccion') {
        if (!userCompanyId || userCompanyId !== companyId) {
          res.status(403).json({ error: 'No tienes permiso para ver los proyectos de esta empresa', code: AuthErrorCode.INTERNAL_ERROR });
          return;
        }
        const result = await this.service.getProjectsByCompanyDetailed(String(companyId));
        res.status(200).json(result);
        return;
      }

      if (normalizedRole === 'admin_financiero') {
        const result: any = await this.service.getProjectsByCompanyDetailed(String(companyId));
        if (projectIds && projectIds.length > 0) {
          const ids = new Set(projectIds);
          result.projects = (result.projects || []).filter((p: any) => ids.has(p.projectId || p.id));
          if (result.summary) result.summary.totalProjects = result.projects.length;
        }
        res.status(200).json(result);
        return;
      }

      // Admin/Gestión
      const result = await this.service.getProjectsByCompanyDetailed(String(companyId));
      res.status(200).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor',
        code: error.code || AuthErrorCode.INTERNAL_ERROR
      });
    }
  };

  // Métodos para Admin/Gestión
  getAllCompanies = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await this.service.getAllCompanies();
      res.status(200).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor',
        code: error.code || AuthErrorCode.INTERNAL_ERROR
      });
    }
  };

  getAllProjectsDetailed = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await this.service.getAllProjectsDetailed();
      res.status(200).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor',
        code: error.code || AuthErrorCode.INTERNAL_ERROR
      });
    }
  };

  getProjectsByCompanyDetailed = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { companyId } = req.params;

      if (!companyId) {
        res.status(400).json({ error: 'ID de compañía no válido', code: AuthErrorCode.INTERNAL_ERROR });
        return;
      }

      const result = await this.service.getProjectsByCompanyDetailed(String(companyId));
      res.status(200).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor',
        code: error.code || AuthErrorCode.INTERNAL_ERROR
      });
    }
  };

  assignManager = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { managerId } = req.body;

      if (!id || typeof id !== 'string') {
        res.status(400).json({ error: 'ID de proyecto no válido', code: AuthErrorCode.INTERNAL_ERROR });
        return;
      }

      if (!managerId || typeof managerId !== 'string') {
        res.status(400).json({ error: 'ID de planificador es requerido', code: AuthErrorCode.INTERNAL_ERROR });
        return;
      }

      const project = await this.service.assignManager(id, managerId);
      res.status(200).json(project);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor',
        code: error.code || AuthErrorCode.INTERNAL_ERROR
      });
    }
  };

  updateAdvance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || typeof id !== 'string') {
        res.status(400).json({ error: 'ID de proyecto no válido', code: AuthErrorCode.INTERNAL_ERROR });
        return;
      }

      const { advanceAmount, amortizedAmount } = req.body;

      const adv = Number(advanceAmount);
      const amort = Number(amortizedAmount);

      if (isNaN(adv) || adv < 0) {
        res.status(400).json({ error: 'El anticipo debe ser un número mayor o igual a 0' });
        return;
      }
      if (isNaN(amort) || amort < 0) {
        res.status(400).json({ error: 'La amortización debe ser un número mayor o igual a 0' });
        return;
      }
      if (amort > adv) {
        res.status(400).json({ error: 'La amortización no puede superar el monto de anticipo' });
        return;
      }

      const updated = await this.service.updateAdvance(id, adv, amort);
      res.status(200).json(updated);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor',
        code: error.code || AuthErrorCode.INTERNAL_ERROR,
      });
    }
  };

  addExpense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const { description, amountUsd, expenseDate } = req.body;
      const userId = req.user?.pmUserId ?? req.user?.userId;

      if (!projectId || typeof projectId !== 'string') {
        res.status(400).json({ error: 'ID de proyecto no válido' });
        return;
      }

      const result = await this.service.addExpense(projectId, description, amountUsd, expenseDate, userId);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor',
        code: error.code || AuthErrorCode.INTERNAL_ERROR,
      });
    }
  };

  getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      if (!projectId || typeof projectId !== 'string') {
        res.status(400).json({ error: 'ID de proyecto no válido' });
        return;
      }

      const result = await this.service.getExpenses(projectId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor',
        code: error.code || AuthErrorCode.INTERNAL_ERROR,
      });
    }
  };

  removeExpense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || typeof id !== 'string') {
        res.status(400).json({ error: 'ID no válido' });
        return;
      }

      const roleName = req.user?.roleName;
      const projectIds = req.user?.projectIds;

      await this.service.removeExpense(id, roleName, projectIds);
      res.status(200).json({ message: 'Gasto eliminado' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor',
        code: error.code || AuthErrorCode.INTERNAL_ERROR,
      });
    }
  };

  updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || typeof id !== 'string') {
        res.status(400).json({ error: 'ID no válido' });
        return;
      }

      const roleName = req.user?.roleName;
      const projectIds = req.user?.projectIds;
      const { description, amountUsd, expenseDate } = req.body;

      const updated = await this.service.updateExpense(id, { description, amountUsd, expenseDate }, roleName, projectIds);
      res.status(200).json(updated);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor',
        code: error.code || AuthErrorCode.INTERNAL_ERROR,
      });
    }
  };

  addCollection = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const { amountUsd, reference, collectedAt, valuationId, grossAmountUsd, amortizedAmountUsd } = req.body;
      const userId = req.user?.pmUserId ?? req.user?.userId;

      if (!projectId || typeof projectId !== 'string') {
        res.status(400).json({ error: 'ID de proyecto no válido' });
        return;
      }

      const result = await this.service.addCollection(
        projectId,
        amountUsd,
        reference,
        collectedAt,
        userId,
        valuationId,
        grossAmountUsd,
        amortizedAmountUsd
      );
      res.status(201).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor',
        code: error.code || AuthErrorCode.INTERNAL_ERROR,
      });
    }
  };

  getCollections = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      if (!projectId || typeof projectId !== 'string') {
        res.status(400).json({ error: 'ID de proyecto no válido' });
        return;
      }

      const result = await this.service.getCollections(projectId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor',
        code: error.code || AuthErrorCode.INTERNAL_ERROR,
      });
    }
  };

  removeCollection = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || typeof id !== 'string') {
        res.status(400).json({ error: 'ID no válido' });
        return;
      }

      const roleName = req.user?.roleName;
      const projectIds = req.user?.projectIds;

      await this.service.removeCollection(id, roleName, projectIds);
      res.status(200).json({ message: 'Cobro eliminado' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor',
        code: error.code || AuthErrorCode.INTERNAL_ERROR,
      });
    }
  };

  updateCollection = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { amountUsd, reference, collectedAt, valuationId, grossAmountUsd, amortizedAmountUsd } = req.body;

      if (!id || typeof id !== 'string') {
        res.status(400).json({ error: 'ID no válido' });
        return;
      }

      const roleName = req.user?.roleName;
      const projectIds = req.user?.projectIds;

      const result = await this.service.updateCollection(
        id,
        { amountUsd, reference, collectedAt, valuationId, grossAmountUsd, amortizedAmountUsd },
        roleName,
        projectIds
      );
      res.status(200).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor',
        code: error.code || AuthErrorCode.INTERNAL_ERROR,
      });
    }
  };

  transfer = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { sourceCompanyId, targetCompanyId, projectIds } = req.body ?? {};
      const result = await this.service.transferProjects(sourceCompanyId, targetCompanyId, projectIds);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error interno del servidor',
        code: error.code || AuthErrorCode.INTERNAL_ERROR,
      });
    }
  };
}

