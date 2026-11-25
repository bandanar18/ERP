import { fetchWithRefresh } from '@/lib/api/fetchWithRefresh';
import type { FinancialValuation, CreateValuationRequest, UpdateValuationStatusRequest, UpdateValuationAmountRequest } from '../interfaces/financial.types';

const API_URL = "/api/financial-planning";

export const financialService = {
  getByProjectId: async (projectId: string): Promise<FinancialValuation[]> => {
    const response = await fetchWithRefresh(`${API_URL}/project/${projectId}`, { method: 'GET' });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  create: async (payload: CreateValuationRequest): Promise<FinancialValuation> => {
    const response = await fetchWithRefresh(API_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  updateStatus: async (id: string, payload: UpdateValuationStatusRequest): Promise<FinancialValuation> => {
    const response = await fetchWithRefresh(`${API_URL}/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  updateAmount: async (id: string, payload: UpdateValuationAmountRequest): Promise<FinancialValuation> => {
    const response = await fetchWithRefresh(`${API_URL}/${id}/amount`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  }
};
