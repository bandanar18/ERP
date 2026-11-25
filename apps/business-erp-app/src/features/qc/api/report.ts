import { qcApi } from './client';

export interface QcPerformanceReport {
  totalIndicators: number;
  complying: number;
  notComplying: number;
  byProcess: Record<string, Array<{ indicator: string; value: number | null; status: string | null }>>;
}

export const reportApi = {
  performance: () => qcApi.get<QcPerformanceReport>('/reports/performance'),
};
