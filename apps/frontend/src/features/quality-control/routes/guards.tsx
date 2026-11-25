import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useQcAuthStore } from "../store/auth.store";
import type { ReactNode } from "react";
import { QC_ROLES } from "../types";

/**
 * Valida si el JWT del módulo ya expiró (payload.exp).
 * Si no se puede decodificar, se considera NO expirado (el backend
 * rechazará el token inválido con 401 y el api-client hará logout).
 */
const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    // El payload JWT usa base64url ('-' y '_'); atob espera base64 estándar ('+' y '/').
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    if (typeof payload?.exp !== "number") return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
};

/**
 * Sesión válida del módulo QC: token presente, NO expirado y usuario cargado.
 * Si el token expiró, limpia la sesión automáticamente.
 */
const useQcSession = () => {
  const { token, user, logout } = useQcAuthStore();
  const expired = token ? isTokenExpired(token) : true;

  useEffect(() => {
    if (token && expired) logout();
  }, [token, expired, logout]);

  const valid = !!token && !expired && !!user;

  return {
    token: valid ? token : null,
    user: valid ? user : null,
    roles: valid ? (user?.roles ?? []) : [],
  };
};

/** Guard privado: sin sesión válida (o token expirado) → login del módulo. */
export const PrivateRoute = () => {
  const { token, user } = useQcSession();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/quality-control/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

/** Guard público: ya autenticado → redirige al dashboard de su rol. */
export const PublicOnlyRoute = ({ children }: { children: ReactNode }) => {
  const { token, user } = useQcSession();

  if (token && user) {
    return <Navigate to={redirectForRoles(user.roles)} replace />;
  }

  return <>{children}</>;
};

/**
 * Protege una ruta por roles del módulo (QC_ADMIN, QC_DIRECTOR, QC_OWNER).
 * Exige sesión válida + que el usuario tenga al menos uno de los roles
 * permitidos. Si no, redirige al dashboard de su rol.
 */
export const QcRoleRoute = ({ allowedRoles, children }: { allowedRoles: string[]; children: ReactNode }) => {
  const { token, user, roles } = useQcSession();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/quality-control/login" state={{ from: location }} replace />;
  }

  if (!roles.some((role) => allowedRoles.includes(role))) {
    return <Navigate to={redirectForRoles(roles)} replace />;
  }

  return <>{children}</>;
};

/**
 * Redirige al dashboard según los roles QC del usuario (ruta índice y
 * cuando no tiene permiso sobre una ruta).
 * Prioridad: admin → admin, director → director, owner → owner.
 */
const redirectForRoles = (roles: string[]): string => {
  if (roles.length === 0) return "/quality-control/sin-acceso";
  if (roles.includes(QC_ROLES.ADMIN)) return "/quality-control/admin";
  if (roles.includes(QC_ROLES.DIRECTOR)) return "/quality-control/director";
  return "/quality-control/owner";
};

/** Componente para la ruta índice: lleva a cada usuario a SU dashboard. */
export const QcRoleDashboardRedirect = () => {
  const { token, user, roles } = useQcSession();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/quality-control/login" state={{ from: location }} replace />;
  }

  return <Navigate to={redirectForRoles(roles)} replace />;
};
