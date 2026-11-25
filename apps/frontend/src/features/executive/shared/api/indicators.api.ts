import { apiFetch } from './api-client';
import { apiUrl } from './config';


export async function getDashboardSummary() {
  const res = await apiFetch(apiUrl('/dashboard/summary'));
  return res.json();
}

export async function getConsolidatedMatrix() {
  const res = await apiFetch(apiUrl('/dashboard/matrix'));
  return res.json();
}

export async function getIndicatorChart(indicatorId: string, periodId?: string) {
  const qs = new URLSearchParams();
  if (periodId) qs.set('periodId', periodId);

  const res = await apiFetch(apiUrl(`/indicators/${indicatorId}/chart?${qs.toString()}`));
  return res.json();
}

export async function getIndicatorSheet(indicatorId: string) {
  const res = await apiFetch(apiUrl(`/indicators/${indicatorId}`));
  return res.json();
}

export async function getProcurementDistribution(indicatorId: string, startsAt?: string, endsAt?: string) {
  const qs = new URLSearchParams();
  if (startsAt) qs.set('startsAt', startsAt);
  if (endsAt) qs.set('endsAt', endsAt);
  
  const res = await apiFetch(apiUrl(`/indicators/${indicatorId}/procurement-distribution?${qs.toString()}`));
  return res.json();
}
