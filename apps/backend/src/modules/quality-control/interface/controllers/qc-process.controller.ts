import { Request, Response, NextFunction } from 'express';
import { QcProcessService } from '../../application/services/qc-process.service.js';
import { QcAuthRequest } from '../middleware/qc-auth.middleware.js';

export class QcProcessController {
  constructor(private readonly processService: QcProcessService) {}

  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.processService.findAll());
    } catch (error) {
      next(error);
    }
  };

  mine = async (req: QcAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.qcUser) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }
      res.json(await this.processService.findMine(req.qcUser.id));
    } catch (error) {
      next(error);
    }
  };
}
