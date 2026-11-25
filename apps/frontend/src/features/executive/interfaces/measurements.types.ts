/**
 * Contrato de mediciones del módulo ejecutivo (integrado en el ERP).
 * Forma equivalente a SubmitMeasurementInput del backend
 * (apps/backend/src/features/executive/interfaces/executive.schemas.ts).
 */
export interface SubmitMeasurementInput {
  indicatorVersionId: string;
  periodId: string;
  directValue?: number;
  inputs?: Record<string, number>;
  observation?: string;
  analysisInternal?: string;
  analysisExternal?: string;
  evidenceIds?: string[];
}
