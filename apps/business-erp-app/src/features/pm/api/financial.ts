import { erpFetch } from './http';
import type { CreateValuationRequest, FinancialValuation, ValuationStatus } from '../types';

const BASE = '/api/financial-planning';

export const financialService = {
  getByProjectId: (projectId: string) =>
    erpFetch<FinancialValuation[]>(BASE, `/project/${projectId}`),

  create: (payload: CreateValuationRequest) =>
    erpFetch<FinancialValuation>(BASE, '', 'POST', payload),

  updateStatus: (id: string, payload: { status: ValuationStatus; invoiceNumber?: string }) =>
    erpFetch<FinancialValuation>(BASE, `/${id}/status`, 'PATCH', payload),

  updateAmount: (id: string, payload: { amountUsd: number }) =>
    erpFetch<FinancialValuation>(BASE, `/${id}/amount`, 'PATCH', payload),
};

