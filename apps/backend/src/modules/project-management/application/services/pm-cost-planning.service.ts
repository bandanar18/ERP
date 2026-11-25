import { IPmCostPlanningRepository } from '../../domain/repositories/pm-cost-planning.repository.interface.js';
import { CreatePmCostPlanningDTO } from '../dtos/pm-cost-planning.dto.js';
import { CreatePmCostPlanningUseCase } from '../use-cases/pm-cost-plannings/create-cost-planning.use-case.js';
import { GetCostPlanningsByProjectUseCase } from '../use-cases/pm-cost-plannings/get-cost-plannings-by-project.use-case.js';
import { PmCostPlanning } from '../../domain/entities/pm-cost-planning.entity.js';

export class PmCostPlanningService {
  private readonly createUseCase: CreatePmCostPlanningUseCase;
  private readonly getByProjectUseCase: GetCostPlanningsByProjectUseCase;

  constructor(repository: IPmCostPlanningRepository) {
    this.createUseCase = new CreatePmCostPlanningUseCase(repository);
    this.getByProjectUseCase = new GetCostPlanningsByProjectUseCase(repository);
  }

  async create(data: CreatePmCostPlanningDTO): Promise<PmCostPlanning> {
    return await this.createUseCase.execute(data);
  }

  async getByProjectId(projectId: string): Promise<PmCostPlanning[]> {
    return await this.getByProjectUseCase.execute(projectId);
  }
}
