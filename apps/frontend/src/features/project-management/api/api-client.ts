import { toast } from 'sonner';
import { usePmAuthStore } from '../store/auth.store';
import { API_BASE } from './config';

interface ApiFetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  public status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

/**
 * Endpoints públicos de auth del módulo. Un 401 aquí significa credenciales
 * o datos inválidos (NO una sesión expirada), así que no deben forzar logout
 * ni redirección — solo propagar el error para que el usuario vea el motivo.
 */
const PUBLIC_AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/send-otp',
  '/auth/verify-otp',
  '/auth/request-password-reset',
  '/auth/reset-password',
];

/** Extrae el mensaje de error del body del backend ({ error } o { message }). */
const parseErrorFromResponse = async (response: Response, fallback: string): Promise<string> => {
  try {
    const errorData = await response.json();
    return errorData.error || errorData.message || fallback;
  } catch {
    return fallback;
  }
};

export const apiFetch = async <T>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> => {
  const { token, logout } = usePmAuthStore.getState();
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!options.body || !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let url = `${API_BASE}${endpoint}`;
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const message = await parseErrorFromResponse(response, 'No autorizado');

    // En endpoints públicos de auth (login, register, OTP, reset), un 401 es un
    // rechazo de credenciales: NO hacemos logout ni recargamos la página, sino
    // que propagamos el mensaje real del backend (p.ej. "Credenciales inválidas...").
    const path = endpoint.split('?')[0];
    if (!PUBLIC_AUTH_ENDPOINTS.some((publicEndpoint) => publicEndpoint === path)) {
      logout();
      window.location.href = '/project-management/login';
    }

    throw new ApiError(401, message);
  }

  if (!response.ok) {
    const message = await parseErrorFromResponse(response, 'Error inesperado');
    toast.error(message);
    throw new ApiError(response.status, message);
  }

  return response.json();
};
