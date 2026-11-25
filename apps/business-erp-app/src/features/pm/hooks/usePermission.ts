import { usePmAuth } from './usePmAuth';

/**
 * Permisos y roles del módulo Project Management.
 * Usa los códigos reales del módulo: roles `PM_*` y permisos `PM_*_WRITE/READ`.
 */
export const usePermission = () => {
  const { user } = usePmAuth();

  const hasPermission = (permission: string) => user?.permissions?.includes(permission) ?? false;
  const hasRole = (role: string) => user?.roles?.includes(role) ?? false;

  const isGestion = hasRole('PM_GESTION') || hasRole('PM_ADMIN');
  const isFinancialAdmin = hasRole('PM_ADMIN_FINANCIERO');

  return {
    hasPermission,
    hasRole,
    canCreate: hasPermission('PM_PROJECTS_WRITE'),
    canCreateCompany: hasPermission('PM_COMPANIES_WRITE'),
    canCreateProgress:
      !isFinancialAdmin &&
      (hasPermission('PM_PHYSICAL_WRITE') ||
        hasRole('PM_PLANIFICADOR') ||
        isGestion),
    canCreateCost:
      !isFinancialAdmin &&
      (hasPermission('PM_COSTS_WRITE') ||
        hasRole('PM_PLANIFICADOR') ||
        isGestion),
    canManageValuations:
      !isFinancialAdmin &&
      (hasPermission('PM_FINANCIAL_WRITE') ||
        hasRole('PM_PLANIFICADOR') ||
        isGestion),
    canUploadGallery:
      hasPermission('PM_GALLERY_WRITE') ||
      hasRole('PM_PLANIFICADOR') ||
      isGestion,
    canViewGallery:
      !isFinancialAdmin &&
      (hasPermission('PM_GALLERY_READ') ||
        hasRole('PM_PLANIFICADOR') ||
        isGestion ||
        hasRole('PM_DIRECCION') ||
        hasRole('direccion')),
    isDireccion:
      hasRole('PM_DIRECCION') ||
      hasRole('direccion') ||
      hasRole('PM_CLIENTE') ||
      hasRole('cliente'),
    isPlanner: hasRole('PM_PLANIFICADOR') || hasRole('planificador'),
    isAdmin: hasRole('PM_ADMIN') || hasRole('admin'),
    isGestion,
    isFinancialAdmin,
    canViewPayables: hasRole('PM_ADMIN') || hasRole('PM_GESTION') || isFinancialAdmin,
    canManagePayables: hasRole('PM_ADMIN') || isFinancialAdmin,
    canPrintReport: !isFinancialAdmin && !hasRole('PM_DIRECCION') && !hasRole('direccion'),
    canPrintFinancialReport: isFinancialAdmin || hasRole('PM_ADMIN') || isGestion,
  };
};
