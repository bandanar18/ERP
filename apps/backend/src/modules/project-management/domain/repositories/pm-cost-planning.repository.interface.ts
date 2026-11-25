import { PmCostPlanning } from '../entities/pm-cost-planning.entity.js';

export interface IPmCostPlanningRepository {
  create(data: Omit<PmCostPlanning, 'id' | 'createdAt' | 'updatedAt'>): Promise<PmCostPlanning>;
  findByProjectId(projectId: string): Promise<PmCostPlanning[]>;
}
