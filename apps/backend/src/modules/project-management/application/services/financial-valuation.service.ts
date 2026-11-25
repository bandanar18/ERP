import { IFinancialValuationRepository } from '../../domain/repositories/financial-valuation.repository.js';
import { CreateFinancialValuationDto, UpdateFinancialValuationDto } from '../dto/financial-valuation.dto.js';
import { CreateFinancialValuationUseCase } from '../use-cases/financial-valuation/create-financial-valuation.use-case.js';
import { UpdateFinancialValuationUseCase } from '../use-cases/financial-valuation/update-financial-valuation.use-case.js';
import { GetProjectFinancialValuationsUseCase } from '../use-cases/financial-valuation/get-project-financial-valuations.use-case.js';

export class FinancialValuationService {
  private createUseCase: CreateFinancialValuationUseCase;
  private updateUseCase: UpdateFinancialValuationUseCase;
  private getProjectValuationsUseCase: GetProjectFinancialValuationsUseCase;

  constructor(private readonly valuationRepository: IFinancialValuationRepository) {
    this.createUseCase = new CreateFinancialValuationUseCase(this.valuationRepository);
    this.updateUseCase = new UpdateFinancialValuationUseCase(this.valuationRepository);
    this.getProjectValuationsUseCase = new GetProjectFinancialValuationsUseCase(this.valuationRepository);
  }

  async createValuation(dto: CreateFinancialValuationDto) {
    return this.createUseCase.execute(dto);
  }

  async updateValuation(id: string, dto: UpdateFinancialValuationDto) {
    return this.updateUseCase.execute(id, dto);
  }

  async getProjectValuations(projectId: string) {
    return this.getProjectValuationsUseCase.execute(projectId);
  }
}
