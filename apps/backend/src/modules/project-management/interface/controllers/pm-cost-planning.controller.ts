import { Request, Response } from 'express';
import { PmCostPlanningService } from '../../application/services/pm-cost-planning.service.js';
import { CreatePmCostPlanningDTOSchema } from '../../application/dtos/pm-cost-planning.dto.js';

export class PmCostPlanningController {
  constructor(private readonly service: PmCostPlanningService) {
    this.create = this.create.bind(this);
    this.getByProjectId = this.getByProjectId.bind(this);
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const parsed = CreatePmCostPlanningDTOSchema.parse(req.body);
      const result = await this.service.create(parsed);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getByProjectId(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId as string;
      const result = await this.service.getByProjectId(projectId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
