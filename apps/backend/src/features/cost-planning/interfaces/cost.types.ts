export interface CreateCostPlanningRequest {
  projectId: string;
  amountUsd: number;
  startDate: string;
  endDate: string;
}

export interface CostPlanningResponse {
  id: string;
  projectId: string;
  amountUsd: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export type GroupedCostsPeriod = 'weekly' | 'monthly';

export interface GroupedCostsRequest {
  period?: GroupedCostsPeriod;
}

export interface GroupedCostPoint {
  period: string;
  amount: number;
}

export interface GroupedCostsResponse {
  projectId: string;
  period: GroupedCostsPeriod;
  costs: GroupedCostPoint[];
}
