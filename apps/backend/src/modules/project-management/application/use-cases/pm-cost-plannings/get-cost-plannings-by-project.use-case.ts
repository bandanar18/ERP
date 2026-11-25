import { IPmCostPlanningRepository } from '../../../domain/repositories/pm-cost-planning.repository.interface.js';
import { PmCostPlanning } from '../../../domain/entities/pm-cost-planning.entity.js';

export class GetCostPlanningsByProjectUseCase {
  constructor(private readonly repository: IPmCostPlanningRepository) {}

  async execute(projectId: string): Promise<PmCostPlanning[]> {
    return await this.repository.findByProjectId(projectId);
  }
}
