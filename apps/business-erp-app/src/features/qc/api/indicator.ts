import { qcApi } from './client';

export interface QcIndicatorDetail {
  id: string;
  organizationId: string;
  processId: string;
  subprocessId: string | null;
  projectId: string | null;
  code: string;
  name: string;
  chartType: string;
  process: { id: string; code: string; name: string };
  versions: Array<{
    id: string;
    frequency: string;
    direction: string;
    formula: string | null;
    inputMode: string;
    displayAsPercent: boolean;
    aggregation: string;
    effectiveFrom: string;
    effectiveTo: string | null;
    targets: Array<{
      id: string;
      targetValue: number;
      unit: string;
      thresholds: Record<string, number>;
    }>;
    measurements: Array<{
      id: string;
      value: number | null;
      status: string;
      trafficLight: string | null;
      periodId: string;
      period: { startsAt: string; endsAt: string };
      observation: string | null;
      inputs: Array<{ key: string; value: number }>;
    }>;
  }>;
}

export interface QcChartPoint {
  period: string;
  meta: number | null;
  medicion: number | null;
  trafficLight: string | null;
}

export interface QcProcurementDistribution {
  confiables: number;
  requierenMejoras: number;
  suspendidos: number;
  total: number;
  porcentajeConfiables: number;
}

export const indicatorApi = {
  detail: (id: string) => qcApi.get<QcIndicatorDetail>(`/indicators/${id}`),
  chart: (id: string) => qcApi.get<QcChartPoint[]>(`/indicators/${id}/chart`),
  procurementDistribution: (id: string) =>
    qcApi.get<QcProcurementDistribution>(`/indicators/${id}/procurement-distribution`),
};
