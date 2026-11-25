import { Request, Response, NextFunction } from 'express';
import { QcAdminProcessService } from '../../application/services/qc-admin-process.service.js';
import {
  createProcessSchema,
  updateProcessSchema,
} from '../../application/dto/qc-admin.dto.js';
import { QcAuthRequest } from '../middleware/qc-auth.middleware.js';

export class QcAdminProcessController {
  constructor(private readonly service: QcAdminProcessService) {}

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.service.findAll());
    } catch (error) {
      next(error);
    }
  };

  findOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.service.findOne(req.params.id as string));
    } catch (error) {
      next(error);
    }
  };

  create = async (req: QcAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = createProcessSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Datos del proceso inválidos' });
        return;
      }
      if (!req.qcUser) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }
      res.status(201).json(await this.service.create(parsed.data, req.qcUser.id));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: QcAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = updateProcessSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Datos del proceso inválidos' });
        return;
      }
      if (!req.qcUser) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }
      res.json(await this.service.update(req.params.id as string, parsed.data, req.qcUser.id));
    } catch (error) {
      next(error);
    }
  };
}
