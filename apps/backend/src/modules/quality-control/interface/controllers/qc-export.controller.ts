import { Request, Response, NextFunction } from 'express';
import { QcExportService } from '../../application/services/qc-export.service.js';
import { exportReportSchema } from '../../application/dto/qc-admin.dto.js';

export class QcExportController {
  constructor(private readonly exportService: QcExportService) {}

  exportPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = exportReportSchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({ error: 'Parámetros del reporte inválidos' });
        return;
      }

      const pdf = await this.exportService.generatePdf(parsed.data);
      const filename = await this.exportService.buildReportFilename(parsed.data, 'pdf');

      res
        .set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        })
        .send(pdf);
    } catch (error) {
      next(error);
    }
  };

  exportXlsx = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = exportReportSchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({ error: 'Parámetros del reporte inválidos' });
        return;
      }

      const xlsx = await this.exportService.generateXlsx(parsed.data);
      const filename = await this.exportService.buildReportFilename(parsed.data, 'xlsx');

      res
        .set({
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        })
        .send(xlsx);
    } catch (error) {
      next(error);
    }
  };
}
