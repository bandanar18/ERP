import { authService } from "../services/auth.service";

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

export const useTokenRefresh = () => {
  const getAccessToken = (): string | null => {
    return localStorage.getItem("token");
  };

  const getRefreshToken = (): string | null => {
    return localStorage.getItem("refreshToken");
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      return null;
    }

    try {
      const data = await authService.refreshToken(refreshToken);
      authService.saveTokens(data);
      return data.accessToken;
    } catch (error) {
      // Si falla el refresh, limpiar todo y redirigir a login
      authService.logout();
      window.location.href = "/auth/login";
      return null;
    }
  };

  // Wrapper para fetch que maneja refresh automático
  const fetchWithRefresh = async (url: string, options: RequestInit = {}): Promise<Response> => {


    // Agregar token a la petición si existe
    if (options.headers === undefined) {
      options.headers = {};
    }

    const token = getAccessToken();
    if (token) {
      (options.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, options);

      // Si el error es 401 (token expirado), intentar refresh
      if (response.status === 401) {
        if (isRefreshing) {
          // Si ya estamos refrescando, esperar a que termine
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(token => {
              // Reintentar con el nuevo token
              if (options.headers === undefined) {
                options.headers = {};
              }
              (options.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
              return fetch(url, options);
            })
            .catch(err => {
              return Promise.reject(err);
            });
        }

        isRefreshing = true;

        try {
          const newToken = await refreshAccessToken();

          if (newToken) {
            processQueue(null, newToken);

            // Reintentar la petición original con el nuevo token
            if (options.headers === undefined) {
              options.headers = {};
            }
            (options.headers as Record<string, string>)["Authorization"] = `Bearer ${newToken}`;
            return fetch(url, options);
          } else {
            processQueue(new Error("No se pudo refrescar el token"), null);
            return Promise.reject(new Error("Sesión expirada"));
          }
        } catch (error) {
          processQueue(error, null);
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }

      return response;
    } catch (error) {
      return Promise.reject(error);
    }
  };

  return {
    getAccessToken,
    getRefreshToken,
    refreshAccessToken,
    fetchWithRefresh,
  };
};
