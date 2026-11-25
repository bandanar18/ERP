import { IPmCostPlanningRepository } from '../../../domain/repositories/pm-cost-planning.repository.interface.js';
import { CreatePmCostPlanningDTO } from '../../dtos/pm-cost-planning.dto.js';
import { PmCostPlanning } from '../../../domain/entities/pm-cost-planning.entity.js';

export class CreatePmCostPlanningUseCase {
  constructor(private readonly repository: IPmCostPlanningRepository) {}

  async execute(data: CreatePmCostPlanningDTO): Promise<PmCostPlanning> {
    return await this.repository.create(data);
  }
}
