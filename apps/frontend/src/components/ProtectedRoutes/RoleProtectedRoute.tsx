import { Navigate } from "react-router-dom";
import { authService } from "@/features/auth";
import { type ReactNode } from "react";

interface RoleProtectedRouteProps {
  allowedRoles: string[];
  children: ReactNode;
}

/**
 * RoleProtectedRoute: Protege rutas por roles específicos.
 * Si el usuario no tiene el rol adecuado, redirige al home de su rol.
 */
export const RoleProtectedRoute = ({ allowedRoles, children }: RoleProtectedRouteProps) => {
  const token = authService.getToken();

  // 1. Verificamos si hay token
  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  // 2. Decodificar el token para obtener el rol
  let userRole: string | null = null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    userRole = payload.roleName;
  } catch (e) {
    console.error("Error decodificando el token:", e);
    return <Navigate to="/auth/login" replace />;
  }

  // 3. Verificar si el usuario tiene el rol permitido
  let normalizedUserRole = userRole?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (normalizedUserRole?.startsWith("pm_")) {
    normalizedUserRole = normalizedUserRole.replace(/^pm_/, "");
  }
  const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

  console.log("RoleProtectedRoute - userRole:", userRole, "normalized:", normalizedUserRole);
  console.log("RoleProtectedRoute - allowedRoles:", allowedRoles, "normalized:", normalizedAllowedRoles);

  if (!userRole || !normalizedUserRole || !normalizedAllowedRoles.includes(normalizedUserRole)) {
    console.log("RoleProtectedRoute - Access denied, redirecting");
    // Redirigir según el rol del usuario
    switch (normalizedUserRole) {
      case "planificador":
        return <Navigate to="/project-management/planificador" replace />;
      case "gestion":
        return <Navigate to="/project-management/gestion" replace />;
      case "administrador":
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to="/project-management/gestion" replace />;
    }
  }

  // 4. Si todo está bien, renderizamos el contenido
  return <>{children}</>;
};
