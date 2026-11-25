import { Response } from 'express';
import { AuthRequest } from '../../auth/middleware/auth.middleware';
import { PhysicalProgressService } from '../services';
import { PhysicalProgressError } from '../interfaces';

export class PhysicalProgressController {
  private readonly service: PhysicalProgressService;

  constructor() {
    this.service = new PhysicalProgressService();
  }

  /**
   * GET /api/physical-progress
   * Planificador: sus avances agrupados por empresa
   * Admin/Gestión: todos los avances agrupados por empresa
   */
  getPlannerProgress = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Los filtros por planificador comparan contra pm_projects.managerId
      // (referencia pm_users.id) → usar pmUserId del módulo cuando exista.
      const userId = req.user!.pmUserId ?? req.user!.userId;
      const roleName = req.user!.roleName;
      const projectIds = req.user!.projectIds;
      const result = await this.service.getPlannerProgress(userId, roleName, projectIds);
      res.json(result);
    } catch (error) {
      if (error instanceof PhysicalProgressError) {
        res.status(error.statusCode).json({ error: error.message, code: error.code });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  };

  /**
   * GET /api/physical-progress/company/:companyId
   * Planificador: sus proyectos de esa empresa
   * Admin/Gestión: todos los proyectos de esa empresa
   */
  getLatestByCompany = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.pmUserId ?? req.user!.userId;
      const roleName = req.user!.roleName;
      const projectIds = req.user!.projectIds;
      const { companyId } = req.params;
      const result = await this.service.getLatestByCompany(userId, roleName, companyId as string, projectIds);
      res.json(result);
    } catch (error) {
      if (error instanceof PhysicalProgressError) {
        res.status(error.statusCode).json({ error: error.message, code: error.code });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  };

  /**
   * GET /api/physical-progress/project/:projectId
   * Planificador: solo si tiene el proyecto asignado
   * Admin/Gestión: cualquier proyecto
   */
  getProjectProgress = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.pmUserId ?? req.user!.userId;
      const roleName = req.user!.roleName;
      const companyId = req.user!.companyId;
      const projectIds = req.user!.projectIds;
      const { projectId } = req.params;
      const result = await this.service.getProjectProgress(userId, roleName, projectId as string, companyId, projectIds);
      res.json(result);
    } catch (error) {
      if (error instanceof PhysicalProgressError) {
        res.status(error.statusCode).json({ error: error.message, code: error.code });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  };

  /**
   * POST /api/physical-progress
   * Crear un nuevo avance físico
   * Planificador: solo para sus proyectos
   */
  create = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.pmUserId ?? req.user!.userId;
      const roleName = req.user!.roleName;
      const projectIds = req.user!.projectIds;
      console.log("PhysicalProgress create - req.body:", req.body);
      console.log("PhysicalProgress create - userId:", userId, "roleName:", roleName);
      const result = await this.service.create(req.body, userId, roleName, projectIds);
      res.status(201).json(result);
    } catch (error) {
      console.error("PhysicalProgress create - ERROR:", error);
      if (error instanceof PhysicalProgressError) {
        res.status(error.statusCode).json({ error: error.message, code: error.code });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  };

  /**
   * PATCH /api/physical-progress/:id
   * Actualizar un avance físico existente
   * Planificador: solo para sus proyectos
   */
  update = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.pmUserId ?? req.user!.userId;
      const roleName = req.user!.roleName;
      const projectIds = req.user!.projectIds;
      const { id } = req.params;
      const result = await this.service.update(id as string, req.body, userId, roleName, projectIds);
      res.json(result);
    } catch (error) {
      console.error("PhysicalProgress update - ERROR:", error);
      if (error instanceof PhysicalProgressError) {
        res.status(error.statusCode).json({ error: error.message, code: error.code });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  };
}
