import { erpFetch } from './http';
import type { CostPlanning, CreateCostRequest } from '../types';

const BASE = '/api/cost-planning';

export const costService = {
  getByProjectId: (projectId: string) =>
    erpFetch<CostPlanning[]>(BASE, `/project/${projectId}`),

  create: (payload: CreateCostRequest) =>
    erpFetch<CostPlanning>(BASE, '', 'POST', payload),
};
