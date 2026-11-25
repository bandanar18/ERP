import { Request, Response, NextFunction } from 'express';
import { QcReportService } from '../../application/services/qc-report.service.js';

export class QcReportController {
  constructor(private readonly reportService: QcReportService) {}

  getPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const periodId = typeof req.query.periodId === 'string' ? req.query.periodId : undefined;
      res.json(await this.reportService.generatePerformanceReport(periodId));
    } catch (error) {
      next(error);
    }
  };
}
