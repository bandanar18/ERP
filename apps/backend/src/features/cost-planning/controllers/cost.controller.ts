import { Request, Response } from 'express';
import { CostPlanningService } from '../services/cost.service';

export class CostPlanningController {
  private service: CostPlanningService;

  constructor() {
    this.service = new CostPlanningService();
  }

  private handleError(res: Response, error: any): Response {
    console.error('[CostPlanning Error]:', error);
    if (error instanceof Error) {
      const isBusinessError = ['no puede ser menor', 'no encontrad', 'obligatorio'].some(msg => error.message.includes(msg));
      if (isBusinessError) {
        return res.status(400).json({ error: error.message });
      }
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const data = req.body;
      if (!data || !data.projectId || data.amountUsd === undefined || !data.startDate || !data.endDate) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }
      const costPlanning = await this.service.create(data);
      return res.status(201).json(costPlanning);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  getByProjectId = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return res.status(400).json({ error: 'Se requiere projectId' });
      }
      const costPlannings = await this.service.getByProjectId(String(projectId));
      return res.json(costPlannings);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  getGroupedCosts = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { projectId } = req.params;
      const { period } = req.query;

      if (!projectId) {
        return res.status(400).json({ error: 'Se requiere projectId' });
      }

      const groupedCosts = await this.service.getGroupedCosts(
        String(projectId),
        period === 'weekly' ? 'weekly' : 'monthly'
      );
      return res.json(groupedCosts);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };
}
