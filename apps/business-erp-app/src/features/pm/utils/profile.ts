import type { PmUser } from '../types';

/** dd/mm/aaaa desde una fecha ISO (o vacío si no hay). */
export function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Iniciales del nombre (o del email como fallback). */
export function initialsOf(p: PmUser): string {
  if (p.firstName || p.lastName) {
    return `${p.firstName?.charAt(0) ?? ''}${p.lastName?.charAt(0) ?? ''}`.toUpperCase();
  }
  const local = p.email.split('@')[0] ?? '?';
  const dot = local.indexOf('.');
  return `${local[0] ?? '?'}${dot > 0 ? local[dot + 1] : ''}`.toUpperCase();
}

export const displayName = (p: PmUser) =>
  p.firstName || p.lastName ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() : p.email;