import { PmValuationStatus } from '@prisma/client';

export class PmFinancialValuation {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly valuationNumber: string,
    public readonly amountUsd: number,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly status: PmValuationStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly invoiceNumber?: string | null
  ) {}
}
