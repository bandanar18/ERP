import { apiFetch } from "./api-client";
import type { QcMeasurement } from "../types";

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
  status: "APPROVED" | "REJECTED";
  observation?: string;
  analysisInternal?: string;
}

export const measurementApi = {
  list: (status?: string) =>
    apiFetch<QcMeasurement[]>("/measurements", { params: { status } }),
  submit: (payload: SubmitMeasurementPayload) =>
    apiFetch<{ success: boolean; measurement: QcMeasurement }>("/measurements", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  review: (id: string, payload: ReviewMeasurementPayload) =>
    apiFetch<{ success: boolean; measurement: QcMeasurement }>(`/measurements/${id}/review`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
