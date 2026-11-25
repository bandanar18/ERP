import { fetchWithRefresh } from '@/lib/api/fetchWithRefresh';
import type { CostPlanning, CreateCostRequest, GroupedCostsResponse } from '../interfaces/cost.types';

const API_URL = "/api/cost-planning";

export const costService = {
  getByProjectId: async (projectId: string): Promise<CostPlanning[]> => {
    const response = await fetchWithRefresh(`${API_URL}/project/${projectId}`, { method: 'GET' });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  getGroupedCosts: async (projectId: string, period: 'weekly' | 'monthly' = 'monthly'): Promise<GroupedCostsResponse> => {
    const response = await fetchWithRefresh(`${API_URL}/project/${projectId}/grouped?period=${period}`, { method: 'GET' });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  },

  create: async (payload: CreateCostRequest): Promise<CostPlanning> => {
    const response = await fetchWithRefresh(API_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  }
};
