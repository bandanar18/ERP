import { apiFetch } from './api-client';
import { apiUrl } from './config';
import type { SubmitMeasurementInput } from '@/features/executive/interfaces/measurements.types';

export async function submitMeasurement(data: SubmitMeasurementInput) {
  const res = await apiFetch(apiUrl('/measurements'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateMeasurementStatus(measurementId: string, status: 'APPROVED' | 'REJECTED', justification?: string) {
  const res = await apiFetch(apiUrl(`/measurements/${measurementId}/review`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    // Contrato del módulo ejecutivo integrado en el ERP: { status, observation }
    body: JSON.stringify({ status, observation: justification }),
  });
  return res.json();
}

const ALLOWED_STATUSES = new Set([
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "LOCKED",
])

export async function getMeasurementsByStatus(status?: string) {
  const query = new URLSearchParams()

  if (status && ALLOWED_STATUSES.has(status)) {
    query.set("status", status)
  }

  const suffix = query.size ? `?${query.toString()}` : ""
  const response = await apiFetch(apiUrl(`/measurements${suffix}`))

  if (!response.ok) {
    throw new Error("No fue posible cargar las mediciones.")
  }

  return response.json()
}
