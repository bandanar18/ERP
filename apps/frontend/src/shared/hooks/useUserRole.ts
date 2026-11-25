import { useMemo } from "react";
import { authService } from "@/features/auth";

export const useUserRole = () => {
  const token = authService.getToken();

  const roleName = useMemo(() => {
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.roleName as string;
    } catch (e) {
      console.error("Error decodificando el token:", e);
      return null;
    }
  }, [token]);

  const canCreate = useMemo(() => {
    if (!roleName) return false;
    return ["gestion", "administrador"].includes(roleName.toLowerCase());
  }, [roleName]);

  // Planificador, gestión y admin pueden crear avances físicos
  const canCreateProgress = useMemo(() => {
    if (!roleName) return false;
    return ["planificador", "gestion", "administrador"].includes(roleName.toLowerCase());
  }, [roleName]);

  const isPlanner = useMemo(() => {
    if (!roleName) return false;
    return roleName.toLowerCase() === "planificador";
  }, [roleName]);

  const isGestion = useMemo(() => {
    if (!roleName) return false;
    return roleName.toLowerCase() === "gestion";
  }, [roleName]);

  const isAdmin = useMemo(() => {
    if (!roleName) return false;
    return roleName.toLowerCase() === "administrador";
  }, [roleName]);

  const isDireccion = useMemo(() => {
    if (!roleName) return false;
    return roleName.toLowerCase() === "direccion";
  }, [roleName]);

  return { roleName, canCreate, canCreateProgress, isPlanner, isGestion, isAdmin, isDireccion };
};
