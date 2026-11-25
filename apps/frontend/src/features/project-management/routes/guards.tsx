import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { usePmAuthStore } from '../store/auth.store';
import type { ReactNode } from 'react';

/**
 * Valida si el JWT del módulo ya expiró (payload.exp).
 * Si no se puede decodificar, se considera NO expirado (el backend
 * rechazará el token inválido con 401 y el api-client hará logout).
 */
const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    // El payload JWT usa base64url ('-' y '_'); atob espera base64 estándar ('+' y '/').
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    if (typeof payload?.exp !== 'number') return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
};

/**
 * Sesión válida del módulo: requiere token presente, NO expirado y usuario cargado.
 * Si el token expiró, limpia la sesión automáticamente (logout del store).
 */
const usePmSession = () => {
  const { token, user, logout } = usePmAuthStore();
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

/**
 * Guard del módulo Project Management: usa el store del módulo (token + roles PM),
 * NO el auth legacy. Sin sesión válida (o token expirado) redirige al login del
 * módulo (/project-management/login), que identifica el módulo en la ruta.
 */
export const PrivateRoute = () => {
  const { token, user } = usePmSession();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/project-management/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export const PublicOnlyRoute = ({ children }: { children: ReactNode }) => {
  const { token, user } = usePmSession();

  if (token && user) {
    // Ya autenticado en el módulo → redirigir al dashboard de su rol
    return <Navigate to={redirectForRoles(user.roles)} replace />;
  }

  return <>{children}</>;
};

/**
 * Protege una ruta por roles del módulo (PM_ADMIN, PM_GESTION, PM_PLANIFICADOR, PM_DIRECCION).
 * Exige sesión válida (token no expirado) + que el usuario tenga al menos uno de los
 * roles permitidos. Si no, redirige al dashboard de su rol.
 */
export const PmRoleRoute = ({ allowedRoles, children }: { allowedRoles: string[]; children: ReactNode }) => {
  const { token, user, roles } = usePmSession();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/project-management/login" state={{ from: location }} replace />;
  }

  if (!roles.some((role) => allowedRoles.includes(role))) {
    return <Navigate to={redirectForRoles(roles)} replace />;
  }

  return <>{children}</>;
};

/**
 * Redirige al dashboard según los roles PM del usuario (para la ruta índice y
 * cuando no tiene permiso sobre una ruta).
 * Prioridad: planificador → su dashboard, dirección → cliente, resto → gestión.
 */
const redirectForRoles = (roles: string[]): string => {
  // Usuario autenticado sin roles: página informativa (evita el bucle de redirección).
  if (roles.length === 0) return '/project-management/sin-acceso';
  if (roles.includes('PM_ADMIN_FINANCIERO') && !roles.includes('PM_ADMIN') && !roles.includes('PM_GESTION'))
    return '/project-management/finanzas';
  if (roles.includes('PM_PLANIFICADOR')) return '/project-management/planificador';
  if (roles.includes('PM_DIRECCION')) return '/project-management/cliente';
  return '/project-management/gestion';
};

/**
 * Componente para la ruta índice: lleva a cada usuario al dashboard de SU rol
 * (en vez de siempre a /gestion).
 */
export const RoleDashboardRedirect = () => {
  const { token, user, roles } = usePmSession();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/project-management/login" state={{ from: location }} replace />;
  }

  return <Navigate to={redirectForRoles(roles)} replace />;
};
