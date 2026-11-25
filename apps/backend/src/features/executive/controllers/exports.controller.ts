import { Request, Response } from 'express';
import { ExportsService } from '../services/exports.service';
import { exportReportSchema } from '../interfaces/executive.schemas';
import { validate, sendError } from '../interfaces/executive.errors';

export class ExportsController {
  private readonly service = new ExportsService();

  exportPdf = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = validate(exportReportSchema, req.query);
      const pdf = await this.service.generatePdf(filters as any);

      res
        .set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="informe-indicadores.pdf"',
        })
        .send(pdf);
    } catch (error) {
      sendError(res, error, 'No se pudo generar el informe PDF.');
    }
  };

  exportXlsx = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = validate(exportReportSchema, req.query);
      const xlsx = await this.service.generateXlsx(filters as any);

      res
        .set({
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="informe-indicadores.xlsx"',
        })
        .send(xlsx);
    } catch (error) {
      sendError(res, error, 'No se pudo generar el archivo Excel.');
    }
  };
}
