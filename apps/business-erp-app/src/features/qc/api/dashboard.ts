import { qcApi } from './client';
import type {
  QcMatrixEntry,
  QcPerformanceReport,
  QcProcess,
  QcReportingPeriod,
  QcSummary,
  QcTrendEntry,
} from '../types';

/**
 * Endpoints de dashboard del módulo Quality Control.
 * Espeja los endpoints del backend: /api/quality-control/dashboard/*.
 */
export const qcDashboardApi = {
  /** Resumen global (cualquier usuario autenticado). */
  summary: () => qcApi.get<QcSummary>('/dashboard/summary'),

  /** Matriz consolidada de indicadores (cualquier usuario autenticado). */
  matrix: () => qcApi.get<QcMatrixEntry[]>('/dashboard/matrix'),

  /** Período de reporte activo (cualquier usuario autenticado). */
  activePeriod: () => qcApi.get<QcReportingPeriod | null>('/dashboard/active-period'),

  /** Resumen del owner restringido a sus procesos asignados (solo QC_OWNER). */
  ownerSummary: () => qcApi.get<QcSummary>('/dashboard/owner/summary'),

  /** Tendencia de cumplimiento (solo QC_ADMIN / QC_DIRECTOR). */
  complianceTrend: () => qcApi.get<QcTrendEntry[]>('/dashboard/director/trend'),

  /** Informe de rendimiento por proceso (solo QC_ADMIN / QC_DIRECTOR). */
  performance: () => qcApi.get<QcPerformanceReport>('/reports/performance'),
};

/**
 * Endpoints de procesos del módulo Quality Control.
 * Espeja los endpoints del backend: /api/quality-control/processes/*.
 */
export const qcProcessApi = {
  /** Lista todos los procesos. */
  list: () => qcApi.get<QcProcess[]>('/processes'),

  /** Procesos asignados al usuario actual (QC_OWNER). */
  mine: () => qcApi.get<QcProcess[]>('/processes/mine'),
};
