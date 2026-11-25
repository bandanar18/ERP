import { Request, Response, NextFunction } from 'express';
import { QcDashboardService } from '../../application/services/qc-dashboard.service.js';
import { QcAuthRequest } from '../middleware/qc-auth.middleware.js';

export class QcDashboardController {
  constructor(private readonly dashboardService: QcDashboardService) {}

  getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.dashboardService.getGlobalSummary());
    } catch (error) {
      next(error);
    }
  };

  getOwnerSummary = async (req: QcAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.dashboardService.getOwnerSummary(req.qcUser!.id));
    } catch (error) {
      next(error);
    }
  };

  getActivePeriod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.dashboardService.getActivePeriod());
    } catch (error) {
      next(error);
    }
  };

  getMatrix = async (req: QcAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.qcUser!;
      if (user.roles.includes('QC_OWNER') && !user.roles.includes('QC_ADMIN') && !user.roles.includes('QC_DIRECTOR')) {
        res.json(await this.dashboardService.getConsolidatedMatrix(user.id));
      } else {
        res.json(await this.dashboardService.getConsolidatedMatrix());
      }
    } catch (error) {
      next(error);
    }
  };

  getComplianceTrend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.dashboardService.getComplianceTrend());
    } catch (error) {
      next(error);
    }
  };
}
