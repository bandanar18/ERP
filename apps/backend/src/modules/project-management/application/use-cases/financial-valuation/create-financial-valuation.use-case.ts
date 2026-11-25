import { IFinancialValuationRepository } from '../../../domain/repositories/financial-valuation.repository.js';
import { CreateFinancialValuationDto } from '../../dto/financial-valuation.dto.js';
import { PmFinancialValuation } from '../../../domain/entities/financial-valuation.entity.js';
import { PmValuationStatus } from '@prisma/client';

export class CreateFinancialValuationUseCase {
  constructor(private readonly valuationRepository: IFinancialValuationRepository) {}

  async execute(dto: CreateFinancialValuationDto): Promise<PmFinancialValuation> {
    return await this.valuationRepository.create({
      projectId: dto.projectId,
      valuationNumber: dto.valuationNumber,
      amountUsd: dto.amountUsd,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: dto.status || PmValuationStatus.POR_VALUAR,
      invoiceNumber: dto.invoiceNumber,
    });
  }
}
