import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submitMeasurement, updateMeasurementStatus, getMeasurementsByStatus } from '../api/measurements.api';
import type { SubmitMeasurementInput } from '@/features/executive/interfaces/measurements.types';

export function useSubmitMeasurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitMeasurementInput) => submitMeasurement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['indicatorChart'] });
    },
  });
}

export function useUpdateMeasurementStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, justification }: { id: string, status: 'APPROVED' | 'REJECTED', justification?: string }) => 
      updateMeasurementStatus(id, status, justification),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
}

export function useMeasurements(status?: string) {
  return useQuery({
    queryKey: ['measurements', status],
    queryFn: () => getMeasurementsByStatus(status),
  });
}
