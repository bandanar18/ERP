import { IFinancialValuationRepository } from '../../../domain/repositories/financial-valuation.repository.js';
import { UpdateFinancialValuationDto } from '../../dto/financial-valuation.dto.js';
import { PmFinancialValuation } from '../../../domain/entities/financial-valuation.entity.js';
import { PmValuationStatus } from '@prisma/client';

export class UpdateFinancialValuationUseCase {
  constructor(private readonly valuationRepository: IFinancialValuationRepository) {}

  async execute(id: string, dto: UpdateFinancialValuationDto): Promise<PmFinancialValuation> {
    const existing = await this.valuationRepository.findById(id);
    if (!existing) {
      throw new Error('Financial valuation not found');
    }

    if (dto.amountUsd !== undefined && dto.amountUsd !== existing.amountUsd) {
      if (existing.status === PmValuationStatus.FACTURADO) {
        throw new Error('Cannot edit amount when status is FACTURADO');
      }
    }

    return await this.valuationRepository.update(id, {
      valuationNumber: dto.valuationNumber,
      amountUsd: dto.amountUsd,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: dto.status,
      invoiceNumber: dto.invoiceNumber,
    });
  }
}
