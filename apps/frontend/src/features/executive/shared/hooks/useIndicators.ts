import { useQuery } from '@tanstack/react-query';
import { 
  getDashboardSummary, 
  getIndicatorChart, 
  getIndicatorSheet, 
  getConsolidatedMatrix, 
  getProcurementDistribution 
} from '../api/indicators.api';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: getDashboardSummary,
  });
}

export function useConsolidatedMatrix() {
  return useQuery({
    queryKey: ['consolidatedMatrix'],
    queryFn: getConsolidatedMatrix,
  });
}


export function useIndicatorChart(indicatorId: string | null, periodId?: string) {
  return useQuery({
    queryKey: ['indicatorChart', indicatorId, periodId],
    queryFn: () => getIndicatorChart(indicatorId!, periodId),
    enabled: !!indicatorId,
  });
}

export function useIndicatorSheet(indicatorId: string | null) {
  return useQuery({
    queryKey: ['indicatorSheet', indicatorId],
    queryFn: () => getIndicatorSheet(indicatorId!),
    enabled: !!indicatorId,
  });
}

export function useProcurementDistribution(indicatorId: string | null, startsAt?: string, endsAt?: string) {
  return useQuery({
    queryKey: ['procurementDistribution', indicatorId, startsAt, endsAt],
    queryFn: () => getProcurementDistribution(indicatorId!, startsAt, endsAt),
    enabled: !!indicatorId && indicatorId !== 'GENERAL',
  });
}
