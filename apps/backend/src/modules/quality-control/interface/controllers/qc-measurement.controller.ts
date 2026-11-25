import { Request, Response, NextFunction } from 'express';
import { QcMeasurementService } from '../../application/services/qc-measurement.service.js';
import { submitMeasurementSchema, reviewMeasurementSchema } from '../../application/dto/qc-measurement.dto.js';
import { QcAuthRequest } from '../middleware/qc-auth.middleware.js';

export class QcMeasurementController {
  constructor(private readonly measurementService: QcMeasurementService) {}

  submit = async (req: QcAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedBody = submitMeasurementSchema.safeParse(req.body);
      if (!parsedBody.success) {
        res.status(400).json({ error: 'Datos de medición inválidos' });
        return;
      }

      if (!req.qcUser) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const result = await this.measurementService.submitMeasurement(parsedBody.data, req.qcUser.id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: QcAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const userRoles = req.qcUser?.roles ?? [];

      // Los QC_OWNER solo ven mediciones de sus procesos asignados
      if (userRoles.includes('QC_OWNER') && !userRoles.some((r) => ['QC_ADMIN', 'QC_DIRECTOR'].includes(r))) {
        if (!req.qcUser) {
          res.status(401).json({ error: 'Usuario no autenticado' });
          return;
        }
        res.json(await this.measurementService.findByProcessAssignments(req.qcUser.id, status));
        return;
      }

      res.json(await this.measurementService.findAll(status));
    } catch (error) {
      next(error);
    }
  };

  review = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsedBody = reviewMeasurementSchema.safeParse(req.body);
      if (!parsedBody.success) {
        res.status(400).json({ error: 'Datos de revisión inválidos' });
        return;
      }

      const qcReq = req as QcAuthRequest;
      if (!qcReq.qcUser) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const result = await this.measurementService.reviewMeasurement(
        req.params.id as string,
        parsedBody.data,
        qcReq.qcUser.id,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
