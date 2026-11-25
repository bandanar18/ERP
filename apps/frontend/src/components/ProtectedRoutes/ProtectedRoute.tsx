import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authService } from "@/features/auth";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

/**
 * ProtectedRoute: El Patovica de tu aplicación.
 * 
 * Ahora también verifica si el usuario tiene el rol necesario.
 */
export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const location = useLocation();
  const token = authService.getToken();
  
  // 1. Verificamos si hay token.
  if (!token) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // 2. Decodificar el token para obtener el rol (sin librerías externas)
  let userRole: string | null = null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    userRole = payload.roleName;
  } catch (e) {
    console.error("Error decodificando el token:", e);
    authService.logout();
    window.location.href = "/auth/login";
    return null;
  }

  // 3. Si hay roles definidos para esta ruta, verificamos si el usuario tiene uno de ellos.
  if (allowedRoles && userRole && !allowedRoles.map(r => r.toLowerCase()).includes(userRole.toLowerCase())) {
    console.warn(`Usuario con rol ${userRole} intentó acceder a ruta protegida.`);
    return <Navigate to="/" replace />;
  }

  // 4. Si todo está bien, lo dejamos pasar.
  return <Outlet />;
};
