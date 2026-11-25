import { Request, Response } from 'express';
import { MeasurementsService } from '../services/measurements.service';
import { ExecutiveAuthRequest } from '../middleware/auth.middleware';
import { submitMeasurementSchema, reviewMeasurementSchema } from '../interfaces/executive.schemas';
import { validate, sendError } from '../interfaces/executive.errors';

export class MeasurementsController {
  private readonly service = new MeasurementsService();

  submitMeasurement = async (req: ExecutiveAuthRequest, res: Response): Promise<void> => {
    try {
      const body = validate(submitMeasurementSchema, req.body);
      const result = await this.service.submitMeasurement(body, req.executiveUser!.id);
      res.status(201).json(result);
    } catch (error) {
      sendError(res, error, 'Error al registrar la medición');
    }
  };

  findAll = async (req: ExecutiveAuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.executiveUser!;
      const userRoles = user.roles;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;

      // Los dueños de proceso solo ven mediciones de sus procesos asignados
      if (
        userRoles.includes('PROCESS_OWNER') &&
        !userRoles.some((r) => ['ADMIN', 'DIRECTOR'].includes(r))
      ) {
        const result = await this.service.findByProcessAssignments(user.id, status);
        res.status(200).json(result);
        return;
      }

      // Admin y Director ven todo
      const result = await this.service.findAll(status);
      res.status(200).json(result);
    } catch (error) {
      sendError(res, error, 'Error al obtener mediciones');
    }
  };

  reviewMeasurement = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = validate(reviewMeasurementSchema, req.body);
      const result = await this.service.reviewMeasurement(
        req.params.id as string,
        body,
        (req as ExecutiveAuthRequest).executiveUser!.id,
      );
      res.status(200).json(result);
    } catch (error) {
      sendError(res, error, 'Error al revisar la medición');
    }
  };
}
