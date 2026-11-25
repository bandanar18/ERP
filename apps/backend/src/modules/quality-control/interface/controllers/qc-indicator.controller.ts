import { Request, Response, NextFunction } from 'express';
import { QcIndicatorService } from '../../application/services/qc-indicator.service.js';

export class QcIndicatorController {
  constructor(private readonly indicatorService: QcIndicatorService) {}

  getIndicator = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.indicatorService.getIndicatorDetail(req.params.id as string));
    } catch (error) {
      next(error);
    }
  };

  getChart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const periodId = typeof req.query.periodId === 'string' ? req.query.periodId : undefined;
      res.json(await this.indicatorService.getChartData(req.params.id as string, periodId));
    } catch (error) {
      next(error);
    }
  };

  getProcurementDistribution = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const startsAt = typeof req.query.startsAt === 'string' ? req.query.startsAt : undefined;
      const endsAt = typeof req.query.endsAt === 'string' ? req.query.endsAt : undefined;
      res.json(await this.indicatorService.getProcurementDistribution(req.params.id as string, startsAt, endsAt));
    } catch (error) {
      next(error);
    }
  };
}
