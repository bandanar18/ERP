import { useQcAuthStore } from "../store/auth.store";
import { QC_ROLES } from "../types";

/**
 * Utilidades de rol del módulo Quality Control.
 *
 * Modelo de permisos:
 *  - QC_ADMIN: operación total (escribe, revisa, administra).
 *  - QC_DIRECTOR: SOLO LECTURA — ve todo pero no edita, no aprueba
 *    ni rechaza mediciones, no administra usuarios ni estructura.
 *  - QC_OWNER: carga y gestiona mediciones de sus procesos asignados.
 */
export const useQcPermission = () => {
  const roles = useQcAuthStore((s) => s.user?.roles ?? []);

  const isAdmin = roles.includes(QC_ROLES.ADMIN);
  const isDirector = roles.includes(QC_ROLES.DIRECTOR);
  const isOwner = roles.includes(QC_ROLES.OWNER);

  // ADMIN/DIRECTOR ven todo; el owner solo sobre lo suyo (alcance de lectura).
  const isManager = isAdmin || isDirector;
  const isAdminOnly = isAdmin && !isDirector && !isOwner;

  // El Director es estrictamente de solo lectura: ve dashboards, reportes,
  // auditoría y mediciones, pero no puede escribir ni revisar nada.
  const isReadOnly = isDirector && !isAdmin;

  return {
    roles,
    isAdmin,
    isDirector,
    isOwner,
    isManager,
    isAdminOnly,
    isReadOnly,
    canReview: isAdmin,
    canSubmit: isOwner || isAdmin,
    canManageUsers: isAdmin,
    canManageStructure: isAdmin,
    canManageIndicators: isAdmin,
    canManagePeriods: isAdmin,
    canExport: isAdmin || isDirector,
    canViewAudit: isAdmin || isDirector,
    canViewReports: isAdmin || isDirector,
  };
};
