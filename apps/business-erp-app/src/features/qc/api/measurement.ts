import { qcApi } from './client';

export interface QcMeasurement {
  id: string;
  indicatorVersionId: string;
  periodId: string;
  value: number | null;
  status: string;
  trafficLight: string | null;
  submittedById: string;
  reviewedById: string | null;
  reviewedAt: string | null;
  observation: string | null;
  createdAt: string;
  updatedAt: string;
  version: {
    id: string;
    frequency: string;
    direction: string;
    formula: string | null;
    inputMode: string;
    displayAsPercent: boolean;
    aggregation: string;
    indicator: {
      id: string;
      code: string;
      name: string;
      chartType: string;
      process: { id: string; code: string; name: string };
    };
    targets: Array<{
      id: string;
      targetValue: number;
      unit: string;
      thresholds: Record<string, number>;
    }>;
  };
  period: {
    id: string;
    startsAt: string;
    endsAt: string;
    dueDate: string;
    status: string;
  };
  submittedBy: { email: string };
  reviewedBy: { email: string } | null;
  inputs: Array<{ id: string; measurementId: string; key: string; value: number }>;
}

export interface SubmitMeasurementPayload {
  indicatorVersionId: string;
  periodId: string;
  directValue?: number;
  inputs?: Record<string, number>;
  observation?: string;
  analysisInternal?: string;
  analysisExternal?: string;
  evidenceIds?: string[];
}

export interface ReviewMeasurementPayload {
  status: 'APPROVED' | 'REJECTED';
  observation?: string;
  analysisInternal?: string;
}

export const measurementApi = {
  list: () => qcApi.get<QcMeasurement[]>('/measurements'),
  submit: (payload: SubmitMeasurementPayload) =>
    qcApi.post<{ success: boolean; measurement: QcMeasurement }>('/measurements', payload),
  review: (id: string, payload: ReviewMeasurementPayload) =>
    qcApi.patch<{ success: boolean; measurement: QcMeasurement }>(`/measurements/${id}/review`, payload),
};
