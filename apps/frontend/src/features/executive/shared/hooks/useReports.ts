import { useQuery } from '@tanstack/react-query';
import { getPerformanceReport } from '../api/reports.api';

export function usePerformanceReport(periodId?: string) {
  return useQuery({
    queryKey: ['performanceReport', periodId],
    queryFn: () => getPerformanceReport(periodId),
  });
}
