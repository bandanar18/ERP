export interface FinancialValuation {
  id: string;
  projectId: string;
  valuationNumber: string;
  amountUsd: number;
  startDate: string;
  endDate: string;
  status: 'POR_VALUAR' | 'POR_FACTURAR' | 'FACTURADO';
  invoiceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateValuationRequest {
  projectId: string;
  valuationNumber: string;
  amountUsd: number;
  startDate: string;
  endDate: string;
}

export interface UpdateValuationStatusRequest {
  status: 'POR_VALUAR' | 'POR_FACTURAR' | 'FACTURADO';
  invoiceNumber?: string;
}

export interface UpdateValuationAmountRequest {
  amountUsd: number;
}
