import { Request, Response } from 'express';
import { IndicatorsService } from '../services/indicators.service';
import { sendError } from '../interfaces/executive.errors';

export class IndicatorsController {
  private readonly service = new IndicatorsService();

  getIndicator = async (req: Request, res: Response): Promise<void> => {
    try {
      const indicator = await this.service.getIndicatorDetail(req.params.id as string);
      res.status(200).json(indicator);
    } catch (error) {
      sendError(res, error, 'Error al obtener el indicador');
    }
  };

  getChart = async (req: Request, res: Response): Promise<void> => {
    try {
      const chartData = await this.service.getChartData(
        req.params.id as string,
        typeof req.query.periodId === 'string' ? req.query.periodId : undefined,
      );
      res.status(200).json(chartData);
    } catch (error) {
      sendError(res, error, 'Error al obtener los datos de la gráfica');
    }
  };

  getProcurementDistribution = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.getProcurementDistribution(
        req.params.id as string,
        typeof req.query.startsAt === 'string' ? req.query.startsAt : undefined,
        typeof req.query.endsAt === 'string' ? req.query.endsAt : undefined,
      );
      res.status(200).json(result);
    } catch (error) {
      sendError(res, error, 'Error al obtener la distribución de proveedores');
    }
  };
}
