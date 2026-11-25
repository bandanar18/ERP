import { usePmAuthStore } from '../store/auth.store';

/**
 * Hooks de permisos/roles del módulo Project Management.
 * Usa los códigos reales del módulo: roles PM_* y permisos PM_*_WRITE/READ.
 */
export const usePermission = () => {
  const { user } = usePmAuthStore();

  const hasPermission = (permission: string) => {
    return user?.permissions?.includes(permission) ?? false;
  };

  const hasRole = (role: string) => {
    return user?.roles?.includes(role) ?? false;
  };

  const isGestion = hasRole('PM_GESTION') || hasRole('PM_ADMIN');

  return {
    hasPermission,
    hasRole,
    canCreate: hasPermission('PM_PROJECTS_WRITE'),
    canCreateCompany: hasPermission('PM_COMPANIES_WRITE'),
    // El botón de registrar avance debe aparecerle a todo rol que puede crear
    // avances (igual que la ruta crear-avance y la API, que son role-based):
    // el permiso PM_PHYSICAL_WRITE depende del seed y de reloguear; el rol no.
    canCreateProgress:
      !hasRole('PM_ADMIN_FINANCIERO') &&
      (hasPermission('PM_PHYSICAL_WRITE') ||
        hasRole('PM_PLANIFICADOR') ||
        isGestion),
    canCreateCost:
      !hasRole('PM_ADMIN_FINANCIERO') &&
      (hasPermission('PM_COSTS_WRITE') ||
        hasRole('PM_PLANIFICADOR') ||
        isGestion),
    canManageValuations:
      !hasRole('PM_ADMIN_FINANCIERO') &&
      (hasPermission('PM_FINANCIAL_WRITE') ||
        hasRole('PM_PLANIFICADOR') ||
        isGestion),
    canUploadGallery:
      hasPermission('PM_GALLERY_WRITE') ||
      hasRole('PM_PLANIFICADOR') ||
      isGestion,
    canViewGallery:
      !hasRole('PM_ADMIN_FINANCIERO') &&
      (hasPermission('PM_GALLERY_READ') ||
        hasRole('PM_PLANIFICADOR') ||
        isGestion ||
        hasRole('PM_DIRECCION')),
    isDireccion: hasRole('PM_DIRECCION'),
    isPlanner: hasRole('PM_PLANIFICADOR'),
    isAdmin: hasRole('PM_ADMIN'),
    isGestion,
    isFinancialAdmin: hasRole('PM_ADMIN_FINANCIERO'),
    canViewPayables: hasRole('PM_ADMIN') || hasRole('PM_GESTION') || hasRole('PM_ADMIN_FINANCIERO'),
    canManagePayables: hasRole('PM_ADMIN') || hasRole('PM_ADMIN_FINANCIERO'),
    canPrintReport: !hasRole('PM_ADMIN_FINANCIERO') && !hasRole('PM_DIRECCION'),
    canPrintFinancialReport: hasRole('PM_ADMIN_FINANCIERO') || hasRole('PM_ADMIN') || hasRole('PM_GESTION'),
  };
};
