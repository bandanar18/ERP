import { apiFetch } from './api-client';
import { apiUrl } from './config';

export async function getPerformanceReport(periodId?: string) {
  const qs = new URLSearchParams();
  if (periodId) qs.set('periodId', periodId);
  const res = await apiFetch(apiUrl(`/dashboard/matrix?${qs.toString()}`));
  return res.json();
}

export function getExportFilename(format: 'xlsx' | 'pdf') {
  return `management.${format}`;
}

export type ExportOptions = {
  processId?: string;
  startsAt?: string;
  endsAt?: string;
  note?: string;
  chartVariant?: 'LINE' | 'BAR';
};

export async function downloadExport(
  format: 'xlsx' | 'pdf',
  options: ExportOptions = {},
) {
  const query = new URLSearchParams();
  if (options.processId) query.set('processId', options.processId);
  if (options.startsAt) query.set('startsAt', options.startsAt);
  if (options.endsAt) query.set('endsAt', options.endsAt);
  if (options.note) query.set('note', options.note);
  if (options.chartVariant) query.set('chartVariant', options.chartVariant);

  const exportUrl = apiUrl(`/exports/${format}?${query.toString()}`);
  const response = await apiFetch(exportUrl, undefined, { silent: true });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? `Error al exportar: ${response.statusText}`);
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    throw new Error('El archivo exportado está vacío');
  }

  const from = options.startsAt ?? 'general';
  const to = options.endsAt ?? 'general';
  const filename = `informe-${format}-${from}-${to}.${format}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
