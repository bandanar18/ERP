import type { ProjectStatus } from '../types';

const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: 'En ejecución',
  ON_HOLD: 'Paralizado',
  RESCHEDULED: 'Reprogramado',
  DELAYED: 'Retraso',
  PLANNED: 'En ejecución',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

export function statusLabel(status: ProjectStatus | string): string {
  return STATUS_LABELS[status] ?? status;
}

export function statusColor(status: ProjectStatus | string): string {
  switch (status) {
    case 'IN_PROGRESS':
    case 'PLANNED':
      return '#4c9b7a';
    case 'ON_HOLD':
      return '#71717a';
    case 'RESCHEDULED':
    case 'COMPLETED':
      return '#5e8fc2';
    case 'DELAYED':
    case 'CANCELLED':
      return '#df6e84';
    default:
      return '#57534e';
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatDate(value?: string | Date): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
