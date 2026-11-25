import { Request, Response } from 'express';
import { FinancialService } from '../services/financial.service';

export class FinancialController {
  private service: FinancialService;

  constructor() {
    this.service = new FinancialService();
  }

  private handleError(res: Response, error: any): Response {
    console.error('[Financial Error]:', error);
    if (error instanceof Error) {
      const isBusinessError = ['no puede ser menor', 'no encontrad', 'supera el Monto', 'obligatorio', 'Transición de estado no válida', 'No se puede editar el monto'].some(msg => error.message.includes(msg));
      if (isBusinessError) {
        return res.status(400).json({ error: error.message });
      }
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const data = req.body;
      if (!data || !data.projectId || !data.valuationNumber || data.amountUsd === undefined || !data.startDate || !data.endDate) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }
      const valuation = await this.service.create(data);
      return res.status(201).json(valuation);
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
      const valuations = await this.service.getByProjectId(String(projectId));
      return res.json(valuations);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  updateStatus = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const data = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Se requiere id' });
      }
      if (!data || !data.status) {
        return res.status(400).json({ error: 'Se requiere status' });
      }
      const valuation = await this.service.updateStatus(String(id), data);
      return res.json(valuation);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  updateAmount = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const data = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Se requiere id' });
      }
      if (!data || data.amountUsd === undefined || data.amountUsd === null || isNaN(Number(data.amountUsd))) {
        return res.status(400).json({ error: 'Se requiere un monto válido' });
      }
      const valuation = await this.service.updateAmount(String(id), { amountUsd: Number(data.amountUsd) });
      return res.json(valuation);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };
}
