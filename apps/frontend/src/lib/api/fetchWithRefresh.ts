const API_URL = "/api/auth";

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

const getAccessToken = (): string | null => {
  return localStorage.getItem("token");
};

const getRefreshToken = (): string | null => {
  return localStorage.getItem("refreshToken");
};

/**
 * Limpia toda la información de autenticación y redirige al login con un mensaje.
 */
const clearAuthAndRedirect = (message: string) => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");

  // Guardar el mensaje en sessionStorage para mostrarlo en la página de login
  sessionStorage.setItem("authMessage", message);
  window.location.href = "/auth/login";
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Detectar usuario desactivado
      if (response.status === 401 && (data.code === 'USER_DISABLED' || data.error === 'Usuario desactivado' || data.error === 'Usuario inválido o inactivo')) {
        clearAuthAndRedirect("Tu cuenta ha sido desactivada. Por favor, contacta al administrador.");
        throw new Error('USER_DISABLED');
      }
      throw new Error(data.error || "Error al refrescar token");
    }

    // Guardar nuevos tokens
    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);

    return data.accessToken;
  } catch (error) {
    const err = error as Error;
    // Si no es error de usuario desactivado, limpiar todo y redirigir a login
    if (err.message !== 'USER_DISABLED') {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/auth/login";
    }
    return null;
  }
};

// Wrapper para fetch que maneja refresh automático
export const fetchWithRefresh = async (url: string, options: RequestInit = {}): Promise<Response> => {


  // Agregar token a la petición si existe
  if (options.headers === undefined) {
    options.headers = {};
  }

  // Agregar Content-Type si hay body y no está definido (excepto para FormData)
  if (options.body && !(options.body instanceof FormData) && !(options.headers as Record<string, string>)["Content-Type"]) {
    (options.headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  const token = getAccessToken();
  if (token) {
    (options.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, options);

    // Si el error es 401, verificar si es usuario desactivado antes de intentar refresh
    if (response.status === 401) {
      const errorData = await response.clone().json();

      // Si es usuario desactivado, limpiar todo y redirigir inmediatamente
      if (errorData.code === 'USER_DISABLED' || errorData.error === 'Usuario desactivado') {
        clearAuthAndRedirect("Tu cuenta ha sido desactivada. Por favor, contacta al administrador.");
        return Promise.reject(new Error('USER_DISABLED'));
      }

      // Si no es usuario desactivado, intentar refresh normal
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
            // Asegurar Content-Type si hay body y no es FormData
            if (options.body && !(options.body instanceof FormData) && !(options.headers as Record<string, string>)["Content-Type"]) {
              (options.headers as Record<string, string>)["Content-Type"] = "application/json";
            }
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
          // Asegurar Content-Type si hay body y no es FormData
          if (options.body && !(options.body instanceof FormData) && !(options.headers as Record<string, string>)["Content-Type"]) {
            (options.headers as Record<string, string>)["Content-Type"] = "application/json";
          }
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

export const getHeaders = () => {
  const token = getAccessToken();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
};
