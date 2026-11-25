import { IFinancialValuationRepository } from '../../../domain/repositories/financial-valuation.repository.js';
import { PmFinancialValuation } from '../../../domain/entities/financial-valuation.entity.js';

export class GetProjectFinancialValuationsUseCase {
  constructor(private readonly valuationRepository: IFinancialValuationRepository) {}

  async execute(projectId: string): Promise<PmFinancialValuation[]> {
    return await this.valuationRepository.findByProjectId(projectId);
  }
}
