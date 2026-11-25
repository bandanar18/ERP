import { Response } from 'express';
import { FileGalleryService } from '../services';
import { AuthRequest } from '../../auth/middleware/auth.middleware';
import { FileGalleryError } from '../interfaces';
import { canPlannerAccessProject } from '../../auth/utils/planner-access';
import { prisma } from '../../../prisma/prisma';

export class FileGalleryController {
  private readonly service: FileGalleryService;

  constructor() {
    this.service = new FileGalleryService();
  }

  private async canPlannerAccessProjectEntity(
    plannerId: string,
    projectIds: string[] | undefined,
    projectId: string
  ): Promise<boolean> {
    const project = await prisma.pmProject.findUnique({
      where: { id: projectId },
      select: { id: true, managerId: true },
    });
    if (!project) return false;
    return canPlannerAccessProject(project, plannerId, projectIds);
  }

  private async canPlannerAccessCompany(
    plannerId: string,
    projectIds: string[] | undefined,
    companyId: string
  ): Promise<boolean> {
    // Solo empresas de proyectos asignados (managerId o scopes), no por companyId del token
    const assigned = await prisma.pmProject.findFirst({
      where: {
        companyId,
        OR: [
          { managerId: plannerId },
          ...((projectIds?.length ?? 0) > 0 ? [{ id: { in: projectIds! } }] : []),
        ],
      },
      select: { id: true },
    });
    return !!assigned;
  }

  /**
   * POST /api/file-gallery/:entityType/:entityId
   * Subir un nuevo archivo
   */
  uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { entityType, entityId } = req.params;
      const { description, category } = req.body;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'No se proporcionó ningún archivo' });
        return;
      }

      // Validar entityId
      if (Array.isArray(entityId)) {
        res.status(400).json({ error: 'ID de entidad no válido' });
        return;
      }

      // Validar entidad soportada
      const supportedEntities = ['Project', 'Company', 'User'];
      if (!supportedEntities.includes(String(entityType))) {
        res.status(400).json({ error: 'Tipo de entidad no soportado' });
        return;
      }

      const { roleName, companyId: userCompanyId, pmUserId, userId, projectIds } = req.user!;
      const normalizedRole = roleName?.toLowerCase().trim();
      const plannerId = pmUserId ?? userId;

      if (normalizedRole === 'planificador') {
        if (entityType === 'Project') {
          const hasAccess = await this.canPlannerAccessProjectEntity(plannerId, projectIds, String(entityId));
          if (!hasAccess) {
            res.status(403).json({ error: 'No tienes permiso para subir archivos a este proyecto' });
            return;
          }
        } else if (entityType === 'Company') {
          const hasAccess = await this.canPlannerAccessCompany(plannerId, projectIds, String(entityId));
          if (!hasAccess) {
            res.status(403).json({ error: 'No tienes permiso para subir archivos a esta empresa' });
            return;
          }
        } else {
          res.status(403).json({ error: 'No tienes permiso para subir archivos a esta entidad' });
          return;
        }
      }

      const result = await this.service.createFile(
        file,
        String(entityType),
        String(entityId),
        { description, category }
      );

      const baseUrl = `${req.protocol}://${req.get('host')}`;

      res.status(201).json({
        file: {
          ...result,
          size: Number(result.size),
          // Si el path es una URL absoluta (seed/demo), se usa directamente
          url: String(result.path).startsWith('http')
            ? String(result.path)
            : `${baseUrl}/uploads/${result.entityType}/${result.entityId}/${result.fileName}`
        },
        message: 'Archivo subido correctamente'
      });
    } catch (error) {
      if (error instanceof FileGalleryError) {
        res.status(error.statusCode).json({ error: error.message, code: error.code });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  };

  /**
   * GET /api/file-gallery/:entityType/:entityId
   * Listar archivos de una entidad
   */
  getFiles = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { entityType, entityId } = req.params;
      const { category, mimeType, startDate, endDate } = req.query;
      const { roleName, companyId: userCompanyId, pmUserId, userId, projectIds } = req.user!;
      
      const normalizedRole = roleName?.toLowerCase().trim();
      const plannerId = pmUserId ?? userId;

      if (normalizedRole === 'planificador') {
        if (entityType === 'Project') {
          const hasAccess = await this.canPlannerAccessProjectEntity(plannerId, projectIds, String(entityId));
          if (!hasAccess) {
            res.status(403).json({ error: 'No tienes permiso para ver los archivos de este proyecto' });
            return;
          }
        } else if (entityType === 'Company') {
          const hasAccess = await this.canPlannerAccessCompany(plannerId, projectIds, String(entityId));
          if (!hasAccess) {
            res.status(403).json({ error: 'No tienes permiso para ver los archivos de esta empresa' });
            return;
          }
        } else {
          res.status(403).json({ error: 'No tienes permiso para ver estos archivos' });
          return;
        }
      }

      if (normalizedRole === 'direccion') {
        if (entityType === 'Project') {
          const project = await prisma.pmProject.findUnique({ where: { id: String(entityId) }, select: { companyId: true } });
          if (!project || project.companyId !== userCompanyId) {
            res.status(403).json({ error: 'No tienes permiso para ver los archivos de este proyecto' });
            return;
          }
        } else if (entityType === 'Company') {
          if (String(entityId) !== userCompanyId) {
            res.status(403).json({ error: 'No tienes permiso para ver los archivos de esta empresa' });
            return;
          }
        } else {
          res.status(403).json({ error: 'No tienes permiso para ver estos archivos' });
          return;
        }
      }

      const filters: any = {};
      if (category) filters.category = category as string;
      if (mimeType) filters.mimeType = mimeType as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const files = await this.service.getFilesByEntity(
        String(entityType),
        String(entityId),
        filters
      );

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const filesWithUrl = files.map(file => ({
        ...file,
        // Si el path es una URL absoluta (seed/demo), se usa directamente
        url: String(file.path).startsWith('http')
          ? String(file.path)
          : `${baseUrl}/uploads/${file.entityType}/${file.entityId}/${file.fileName}`
      }));

      res.json({
        files: filesWithUrl,
        total: files.length,
        entityType,
        entityId
      });
    } catch (error) {
      if (error instanceof FileGalleryError) {
        res.status(error.statusCode).json({ error: error.message, code: error.code });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  };

  /**
   * GET /api/file-gallery/file/:id
   * Obtener detalles de un archivo específico
   */
  getFile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const file = await this.service.getFileById(String(id));
      
      const { roleName, companyId: userCompanyId, pmUserId, userId, projectIds } = req.user!;
      const normalizedRole = roleName?.toLowerCase().trim();
      const plannerId = pmUserId ?? userId;

      if (normalizedRole === 'planificador') {
        if (file.entityType === 'Project') {
          const hasAccess = await this.canPlannerAccessProjectEntity(plannerId, projectIds, file.entityId);
          if (!hasAccess) {
            res.status(403).json({ error: 'No tienes permiso para ver este archivo' });
            return;
          }
        } else if (file.entityType === 'Company') {
          const hasAccess = await this.canPlannerAccessCompany(plannerId, projectIds, file.entityId);
          if (!hasAccess) {
            res.status(403).json({ error: 'No tienes permiso para ver este archivo' });
            return;
          }
        } else {
          res.status(403).json({ error: 'No tienes permiso para ver este archivo' });
          return;
        }
      }

      if (normalizedRole === 'direccion') {
        if (file.entityType === 'Project') {
          const project = await prisma.pmProject.findUnique({ where: { id: file.entityId }, select: { companyId: true } });
          if (!project || project.companyId !== userCompanyId) {
            res.status(403).json({ error: 'No tienes permiso para ver este archivo' });
            return;
          }
        } else if (file.entityType === 'Company') {
          if (file.entityId !== userCompanyId) {
            res.status(403).json({ error: 'No tienes permiso para ver este archivo' });
            return;
          }
        } else {
          res.status(403).json({ error: 'No tienes permiso para ver este archivo' });
          return;
        }
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      res.json({
        ...file,
        url: String(file.path).startsWith('http')
          ? String(file.path)
          : `${baseUrl}/uploads/${file.entityType}/${file.entityId}/${file.fileName}`
      });
    } catch (error) {
      if (error instanceof FileGalleryError) {
        res.status(error.statusCode).json({ error: error.message, code: error.code });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  };

  /**
   * GET /api/file-gallery/download/:id
   * Descargar un archivo
   */
  downloadFile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const file = await this.service.getFileById(String(id));

      const { roleName, companyId: userCompanyId, pmUserId, userId, projectIds } = req.user!;
      const normalizedRole = roleName?.toLowerCase().trim();
      const plannerId = pmUserId ?? userId;

      if (normalizedRole === 'planificador') {
        if (file.entityType === 'Project') {
          const hasAccess = await this.canPlannerAccessProjectEntity(plannerId, projectIds, file.entityId);
          if (!hasAccess) {
            res.status(403).json({ error: 'No tienes permiso para descargar este archivo' });
            return;
          }
        } else if (file.entityType === 'Company') {
          const hasAccess = await this.canPlannerAccessCompany(plannerId, projectIds, file.entityId);
          if (!hasAccess) {
            res.status(403).json({ error: 'No tienes permiso para descargar este archivo' });
            return;
          }
        } else {
          res.status(403).json({ error: 'No tienes permiso para descargar este archivo' });
          return;
        }
      }

      if (normalizedRole === 'direccion') {
        if (file.entityType === 'Project') {
          const project = await prisma.pmProject.findUnique({ where: { id: file.entityId }, select: { companyId: true } });
          if (!project || project.companyId !== userCompanyId) {
            res.status(403).json({ error: 'No tienes permiso para descargar este archivo' });
            return;
          }
        } else if (file.entityType === 'Company') {
          if (file.entityId !== userCompanyId) {
            res.status(403).json({ error: 'No tienes permiso para descargar este archivo' });
            return;
          }
        } else {
          res.status(403).json({ error: 'No tienes permiso para descargar este archivo' });
          return;
        }
      }

      // Si el archivo del seed/demo apunta a una URL absoluta, redirigir ahí
      if (String(file.path).startsWith('http')) {
        res.redirect(String(file.path));
        return;
      }

      res.download(file.path, file.originalName, (err) => {
        if (err) {
          res.status(404).json({ error: 'Archivo no encontrado' });
        }
      });
    } catch (error) {
      if (error instanceof FileGalleryError) {
        res.status(error.statusCode).json({ error: error.message, code: error.code });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  };

  /**
   * DELETE /api/file-gallery/:id
   * Eliminar un archivo
   */
  deleteFile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { roleName, companyId: userCompanyId, pmUserId, userId, projectIds } = req.user!;
      const normalizedRole = roleName?.toLowerCase().trim();
      const plannerId = pmUserId ?? userId;

      if (normalizedRole === 'direccion') {
        res.status(403).json({ error: 'No tienes permiso para eliminar archivos' });
        return;
      }

      if (normalizedRole === 'planificador') {
        const file = await this.service.getFileById(String(id));
        if (file.entityType === 'Project') {
          const hasAccess = await this.canPlannerAccessProjectEntity(plannerId, projectIds, file.entityId);
          if (!hasAccess) {
            res.status(403).json({ error: 'No tienes permiso para eliminar archivos de este proyecto' });
            return;
          }
        } else if (file.entityType === 'Company') {
          const hasAccess = await this.canPlannerAccessCompany(plannerId, projectIds, file.entityId);
          if (!hasAccess) {
            res.status(403).json({ error: 'No tienes permiso para eliminar archivos de esta empresa' });
            return;
          }
        } else {
          res.status(403).json({ error: 'No tienes permiso para eliminar este archivo' });
          return;
        }
      }

      const result = await this.service.deleteFile(String(id));
      res.json(result);
    } catch (error) {
      if (error instanceof FileGalleryError) {
        res.status(error.statusCode).json({ error: error.message, code: error.code });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  };

  /**
   * GET /api/file-gallery/:entityType/:entityId/stats
   * Obtener estadísticas de archivos de una entidad
   */
  getStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { entityType, entityId } = req.params;
      const { roleName, companyId: userCompanyId, pmUserId, userId, projectIds } = req.user!;
      
      const normalizedRole = roleName?.toLowerCase().trim();
      const plannerId = pmUserId ?? userId;

      if (normalizedRole === 'planificador') {
        if (entityType === 'Project') {
          const hasAccess = await this.canPlannerAccessProjectEntity(plannerId, projectIds, String(entityId));
          if (!hasAccess) {
            res.status(403).json({ error: 'No tienes permiso para ver las estadísticas de este proyecto' });
            return;
          }
        } else if (entityType === 'Company') {
          const hasAccess = await this.canPlannerAccessCompany(plannerId, projectIds, String(entityId));
          if (!hasAccess) {
            res.status(403).json({ error: 'No tienes permiso para ver las estadísticas de esta empresa' });
            return;
          }
        } else {
          res.status(403).json({ error: 'No tienes permiso para ver estas estadísticas' });
          return;
        }
      }

      if (normalizedRole === 'direccion') {
        if (entityType === 'Project') {
          const project = await prisma.pmProject.findUnique({ where: { id: String(entityId) }, select: { companyId: true } });
          if (!project || project.companyId !== userCompanyId) {
            res.status(403).json({ error: 'No tienes permiso para ver las estadísticas de este proyecto' });
            return;
          }
        } else if (entityType === 'Company') {
          if (String(entityId) !== userCompanyId) {
            res.status(403).json({ error: 'No tienes permiso para ver las estadísticas de esta empresa' });
            return;
          }
        } else {
          res.status(403).json({ error: 'No tienes permiso para ver estas estadísticas' });
          return;
        }
      }

      const stats = await this.service.getEntityStats(String(entityType), String(entityId));
      res.json(stats);
    } catch (error) {
      if (error instanceof FileGalleryError) {
        res.status(error.statusCode).json({ error: error.message, code: error.code });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  };
}
