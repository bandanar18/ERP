import { Request, Response } from 'express';
import { FinancialValuationService } from '../../application/services/financial-valuation.service.js';
import { createFinancialValuationSchema, updateFinancialValuationSchema } from '../../application/dto/financial-valuation.dto.js';

export class FinancialValuationController {
  constructor(private readonly valuationService: FinancialValuationService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = createFinancialValuationSchema.parse(req.body);
      
      const result = await this.valuationService.createValuation(parsed);
      res.status(201).json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Validation Error', details: error.errors });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const parsed = updateFinancialValuationSchema.parse(req.body);
      
      const result = await this.valuationService.updateValuation(id, parsed);
      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Validation Error', details: error.errors });
        return;
      }
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message.includes('Cannot edit amount')) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  };

  getByProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = req.params.projectId as string;
      const result = await this.valuationService.getProjectValuations(projectId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
