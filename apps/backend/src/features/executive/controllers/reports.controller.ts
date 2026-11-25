import { Request, Response } from 'express';
import { ReportsService } from '../services/reports.service';
import { sendError } from '../interfaces/executive.errors';

export class ReportsController {
  private readonly service = new ReportsService();

  getPerformanceReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const periodId = typeof req.query.periodId === 'string' ? req.query.periodId : undefined;
      const report = await this.service.generatePerformanceReport(periodId);
      res.status(200).json(report);
    } catch (error) {
      sendError(res, error, 'Error al generar el reporte de desempeño');
    }
  };
}
