import { Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { ExecutiveAuthRequest } from '../middleware/auth.middleware';
import { sendError } from '../interfaces/executive.errors';

export class DashboardController {
  private readonly service = new DashboardService();

  getSummary = async (_req: ExecutiveAuthRequest, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.getGlobalSummary());
    } catch (error) {
      sendError(res, error, 'Error al obtener el resumen');
    }
  };

  getAdminSummary = async (_req: ExecutiveAuthRequest, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.getGlobalSummary());
    } catch (error) {
      sendError(res, error, 'Error al obtener el resumen');
    }
  };

  getDirectorSummary = async (_req: ExecutiveAuthRequest, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.getGlobalSummary());
    } catch (error) {
      sendError(res, error, 'Error al obtener el resumen');
    }
  };

  getOwnerSummary = async (req: ExecutiveAuthRequest, res: Response): Promise<void> => {
    try {
      const processes = req.executiveUser?.scopes?.processes ?? [];
      res.status(200).json(await this.service.getOwnerSummary(processes));
    } catch (error) {
      sendError(res, error, 'Error al obtener el resumen');
    }
  };

  getConsolidatedMatrix = async (_req: ExecutiveAuthRequest, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.getConsolidatedMatrix());
    } catch (error) {
      sendError(res, error, 'Error al obtener la matriz consolidada');
    }
  };

  getActivePeriod = async (_req: ExecutiveAuthRequest, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.getActivePeriod());
    } catch (error) {
      sendError(res, error, 'Error al obtener el período activo');
    }
  };

  getComplianceTrend = async (_req: ExecutiveAuthRequest, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.getComplianceTrend());
    } catch (error) {
      sendError(res, error, 'Error al obtener la tendencia de cumplimiento');
    }
  };
}
