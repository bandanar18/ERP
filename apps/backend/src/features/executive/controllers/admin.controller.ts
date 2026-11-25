import { Request, Response } from 'express';
import {
  AdminIndicatorsService,
  AdminProcessesService,
} from '../services/admin.service';
import { ExecutiveAuthRequest } from '../middleware/auth.middleware';
import {
  createIndicatorSchema,
  updateIndicatorSchema,
  createProcessSchema,
  updateProcessSchema,
} from '../interfaces/executive.schemas';
import { validate, sendError } from '../interfaces/executive.errors';

export class AdminIndicatorsController {
  private readonly service = new AdminIndicatorsService();

  findAll = async (_req: ExecutiveAuthRequest, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.findAll());
    } catch (error) {
      sendError(res, error, 'Error al obtener indicadores');
    }
  };

  findOne = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.findOne(req.params.id as string));
    } catch (error) {
      sendError(res, error, 'Error al obtener el indicador');
    }
  };

  create = async (req: ExecutiveAuthRequest, res: Response): Promise<void> => {
    try {
      const dto = validate(createIndicatorSchema, req.body);
      const result = await this.service.create(dto, req.executiveUser!.id);
      res.status(201).json(result);
    } catch (error) {
      sendError(res, error, 'Error al crear el indicador');
    }
  };

  update = async (req: ExecutiveAuthRequest, res: Response): Promise<void> => {
    try {
      const dto = validate(updateIndicatorSchema, req.body);
      const result = await this.service.update(req.params.id as string, dto, req.executiveUser!.id);
      res.status(200).json(result);
    } catch (error) {
      sendError(res, error, 'Error al actualizar el indicador');
    }
  };
}

export class AdminProcessesController {
  private readonly service = new AdminProcessesService();

  findAll = async (_req: ExecutiveAuthRequest, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.findAll());
    } catch (error) {
      sendError(res, error, 'Error al obtener procesos');
    }
  };

  findOne = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.findOne(req.params.id as string));
    } catch (error) {
      sendError(res, error, 'Error al obtener el proceso');
    }
  };

  create = async (req: ExecutiveAuthRequest, res: Response): Promise<void> => {
    try {
      const dto = validate(createProcessSchema, req.body);
      const result = await this.service.create(dto, req.executiveUser!.id);
      res.status(201).json(result);
    } catch (error) {
      sendError(res, error, 'Error al crear el proceso');
    }
  };

  update = async (req: ExecutiveAuthRequest, res: Response): Promise<void> => {
    try {
      const dto = validate(updateProcessSchema, req.body);
      const result = await this.service.update(req.params.id as string, dto, req.executiveUser!.id);
      res.status(200).json(result);
    } catch (error) {
      sendError(res, error, 'Error al actualizar el proceso');
    }
  };
}
