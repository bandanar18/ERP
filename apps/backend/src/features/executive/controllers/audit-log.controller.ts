import { Request, Response } from 'express';
import { AuditLogService } from '../services/admin.service';
import { sendError } from '../interfaces/executive.errors';

export class AuditLogController {
  private readonly service = new AuditLogService();

  findAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.findAll());
    } catch (error) {
      sendError(res, error, 'Error al obtener la bitácora de auditoría');
    }
  };
}
