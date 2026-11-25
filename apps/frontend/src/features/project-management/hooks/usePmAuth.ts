import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../api/auth.api';
import { usePmAuthStore } from '../store/auth.store';
import type { LoginDto } from '../types';

export const usePmAuth = () => {
  const navigate = useNavigate();
  const { setAuth, logout, user, token } = usePmAuthStore();

  const loginMutation = useMutation({
    mutationFn: (data: LoginDto) => authApi.login(data),
    onSuccess: (data) => {
      setAuth(data.token, data.user);

      // El backend ya devuelve redirectUrl en el login — redirigimos directo.
      // Fallback al dashboard de gestión si viniera vacío.
      const redirectUrl = (data as any)?.redirectUrl || '/project-management/gestion';
      navigate(redirectUrl, { replace: true });
    },
    onError: (error: any) => {
      const message = error?.message || 'Error al iniciar sesión';
      toast.error(message);
    }
  });

  const handleLogout = () => {
    logout();
    navigate('/project-management/login', { replace: true });
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
