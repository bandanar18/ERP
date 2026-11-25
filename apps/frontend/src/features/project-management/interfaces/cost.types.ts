export interface CostPlanning {
  id: string;
  projectId: string;
  amountUsd: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCostRequest {
  projectId: string;
  amountUsd: number;
  startDate: string;
  endDate: string;
}

export type GroupedCostsPeriod = 'weekly' | 'monthly';

export interface GroupedCostPoint {
  period: string;
  amount: number;
}

export interface GroupedCostsResponse {
  projectId: string;
  period: GroupedCostsPeriod;
  costs: GroupedCostPoint[];
}
