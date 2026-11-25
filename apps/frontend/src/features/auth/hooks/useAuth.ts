import { useState } from "react";
import { authService } from "../services/auth.service";
import { useNavigate } from "react-router-dom";
import { useToastCases } from "@/shared/hooks";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "El correo o la contrasena son incorrectos.",
  USER_DISABLED: "Tu cuenta esta desactivada. Contacta a soporte.",
  EMAIL_ALREADY_EXISTS: "Este correo ya esta registrado.",
  INTERNAL_ERROR: "Algo salio mal. Reintenta en un momento.",
  ROLE_NOT_FOUND: "El rol especificado no existe."
};

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const toast = useToastCases();

  const navigateByRole = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case "administrador":
        navigate("/admin");
        break;
      // Agregar más casos según sea necesario
      default:
        navigate("/");
    }
  };

  const login = async (credentials: { email: string; password: any }) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.login(credentials);

      // Si el login fue exitoso y tiene token, guardamos y navegamos
      if (data.accessToken) {
        authService.saveTokens(data);
        authService.saveUser(data.user);
        toast.loginSuccess();

        // Redirigir según el rol del usuario
        const roleName = data.user.role?.name;
        if (roleName) {
          navigateByRole(roleName);
        } else {
          navigate("/");
        }
      }

      // Devolvemos la data para que el componente maneje casos especiales (requiresOtp, pendingCompany)
      return data;
    } catch (err: any) {
      // Caso: Email no verificado (el backend tira error 403)
      if (err.code === "USER_NOT_VERIFIED") {
        await authService.sendOtp(credentials.email);
        toast.codeSent();
        navigate(`/auth/verify?email=${encodeURIComponent(credentials.email)}`);
        return;
      }

      const friendlyMessage = AUTH_ERROR_MESSAGES[err.code] || err.error || "Error inesperado";

      // Detectar error de rate limiting
      if (friendlyMessage.toLowerCase().includes("esperar") || friendlyMessage.toLowerCase().includes("máximo")) {
        toast.rateLimitError(friendlyMessage);
      } else {
        toast.loginError(friendlyMessage);
      }

      setError(friendlyMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.register(userData);
      await authService.sendOtp(userData.email);
      toast.registerSuccess();
      navigate(`/auth/verify?email=${encodeURIComponent(userData.email)}`);
      return data;
    } catch (err: any) {
      const friendlyMessage = AUTH_ERROR_MESSAGES[err.code] || err.error || "Error inesperado";

      // Detectar error de rate limiting (mensaje que contiene "esperar" o "máximo")
      if (friendlyMessage.toLowerCase().includes("esperar") || friendlyMessage.toLowerCase().includes("máximo")) {
        toast.rateLimitError(friendlyMessage);
      } else {
        toast.registerError(friendlyMessage);
      }

      setError(friendlyMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (email: string, code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authService.verifyOtp(email, code);
      if (result.verified) {
        toast.verificationSuccess();
      }
      return result.verified;
    } catch (err: any) {
      const errorMsg = err.error || "Código inválido o expirado";
      setError(errorMsg);
      toast.verificationError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    // Limpiar cualquier estado adicional si lo hubiera en el futuro
    window.location.href = "/auth/login";
  };

  return { login, register, verifyOtp, logout, isLoading, error };
};
