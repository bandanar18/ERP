import type { Href } from 'expo-router';

import { QC_ROLES, QC_ROLE_LABELS } from '../types';

/** Resuelve la ruta del dashboard según los roles QC del usuario. */
export function resolveDashboardRoute(roles: string[]): Href {
  if (roles.includes(QC_ROLES.ADMIN)) return '/qc/admin';
  if (roles.includes(QC_ROLES.DIRECTOR)) return '/qc/director';
  if (roles.includes(QC_ROLES.OWNER)) return '/qc/owner';
  return '/qc/sin-acceso';
}

/** Etiqueta legible del rol principal del usuario. */
export function roleLabel(roles: string[]): string {
  if (roles.includes(QC_ROLES.ADMIN)) return QC_ROLE_LABELS.QC_ADMIN;
  if (roles.includes(QC_ROLES.DIRECTOR)) return QC_ROLE_LABELS.QC_DIRECTOR;
  if (roles.includes(QC_ROLES.OWNER)) return QC_ROLE_LABELS.QC_OWNER;
  return 'Sin rol';
}

/** Solo el administrador puede acceder a la sección de administración. */
export function isAdmin(roles: string[]): boolean {
  return roles.includes(QC_ROLES.ADMIN);
}

/** Admin o Director pueden ver reportes y auditoría. */
export function canViewControl(roles: string[]): boolean {
  return roles.includes(QC_ROLES.ADMIN) || roles.includes(QC_ROLES.DIRECTOR);
}
