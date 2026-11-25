import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authApi } from "../api/auth.api";
import { useQcAuthStore } from "../store/auth.store";
import type { QcLoginDto } from "../types";

export const useQcAuth = () => {
  const navigate = useNavigate();
  const { setAuth, logout, user, token } = useQcAuthStore();

  const loginMutation = useMutation({
    mutationFn: (data: QcLoginDto) => authApi.login(data),
    onSuccess: (data) => {
      setAuth(data.token, data.user);

      // El backend ya devuelve redirectUrl en el login — redirigimos directo.
      const redirectUrl = data?.redirectUrl || "/quality-control/owner";
      navigate(redirectUrl, { replace: true });
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Error al iniciar sesión");
    },
  });

  const handleLogout = () => {
    logout();
    navigate("/quality-control/login", { replace: true });
  };

  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    logout: handleLogout,
  };
};
