import { Request, Response, NextFunction } from 'express';
import { QcAdminIndicatorService } from '../../application/services/qc-admin-indicator.service.js';
import {
  createIndicatorSchema,
  updateIndicatorSchema,
} from '../../application/dto/qc-admin.dto.js';
import { QcAuthRequest } from '../middleware/qc-auth.middleware.js';

export class QcAdminIndicatorController {
  constructor(private readonly service: QcAdminIndicatorService) {}

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
      const parsed = createIndicatorSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Datos del indicador inválidos' });
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
      const parsed = updateIndicatorSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Datos del indicador inválidos' });
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
