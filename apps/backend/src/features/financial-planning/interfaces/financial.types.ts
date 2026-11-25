export interface CreateFinancialValuationRequest {
  projectId: string;
  valuationNumber: string;
  amountUsd: number;
  startDate: string;
  endDate: string;
}

export interface UpdateFinancialValuationStatusRequest {
  status: 'POR_VALUAR' | 'POR_FACTURAR' | 'FACTURADO';
  invoiceNumber?: string;
}

export interface UpdateFinancialValuationAmountRequest {
  amountUsd: number;
}

export interface FinancialValuationResponse {
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
