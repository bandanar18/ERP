import type { Href } from 'expo-router';

/** Resuelve la ruta del dashboard según los roles del usuario. */
export function resolveDashboardRoute(roles: string[]): Href {
  if (roles.includes('PM_ADMIN_FINANCIERO') && !roles.includes('PM_ADMIN') && !roles.includes('PM_GESTION')) {
    return '/pm/finanzas';
  }
  if (roles.includes('PM_ADMIN') || roles.includes('PM_GESTION')) return '/pm/gestion';
  if (roles.includes('PM_PLANIFICADOR')) return '/pm/planificador';
  if (roles.includes('PM_DIRECCION')) return '/pm/cliente';
  return '/pm/sin-acceso';
}

/** Etiqueta legible del rol principal del usuario. */
export function roleLabel(roles: string[]): string {
  if (roles.includes('PM_ADMIN')) return 'Administrador';
  if (roles.includes('PM_GESTION')) return 'Gestión';
  if (roles.includes('PM_ADMIN_FINANCIERO')) return 'Administrador Financiero';
  if (roles.includes('PM_PLANIFICADOR')) return 'Planificador';
  if (roles.includes('PM_DIRECCION')) return 'Dirección';
  return 'Sin rol';
}

/**
 * Roles con permisos de escritura en el módulo (crear/editar proyectos,
 * cargar costos y valuaciones, subir archivos). Espeja los `writeRoles`
 * de los endpoints legacy del backend.
 */
export function canManage(roles: string[]): boolean {
  return roles.includes('PM_ADMIN') || roles.includes('PM_GESTION');
}

/** Solo el administrador puede mutar usuarios del módulo (PATCH module-users exige PM_ADMIN). */
export function isAdmin(roles: string[]): boolean {
  return roles.includes('PM_ADMIN');
}
