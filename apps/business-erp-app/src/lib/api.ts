/**
 * Business ERP App — API client tipado para el backend del ERP.
 *
 * Base URL configurable vía EXPO_PUBLIC_API_URL (ver .env).
 * Endpoints disponibles (backend Express):
 *   GET  /                          → info del API (health check)
 *   POST /api/auth/login            → autenticación ERP legacy
 *   GET  /api/projects              → proyectos (requiere token)
 *   GET  /api/quality-control/...   → módulo de calidad
 *   GET  /api/project-management/...→ módulo de proyectos
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Token JWT (Authorization: Bearer). */
  token?: string;
  headers?: Record<string, string>;
  /** Timeout en ms (default 15s). */
  timeoutMs?: number;
}

export interface ApiHealth {
  name: string;
  version: string;
  documentation: string;
  openapi: string;
}

/**
 * Fetch tipado contra el backend con manejo de errores uniforme.
 */
async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    token,
    headers: extraHeaders,
    timeoutMs = 15000,
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      let message = `Error ${response.status}`;
      let details: unknown;
      try {
        const data = (await response.json()) as { error?: string; message?: string };
        message = data.error ?? data.message ?? message;
        details = data;
      } catch {
        // respuesta sin JSON
      }
      throw new ApiError(response.status, message, details);
    }

    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(0, 'Tiempo de espera agotado. Revisa la conexión al servidor.');
    }
    throw new ApiError(
      0,
      `No se pudo conectar con el servidor (${BASE_URL}). ¿Está el backend corriendo?`,
    );
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: <T>(path: string, options?: ApiRequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: ApiRequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
};

/** Endpoints de ejemplo listos para usar. */
export const erpApi = {
  /** Info del API / health check (endpoint público, no requiere token). */
  health: () => api.get<ApiHealth>('/'),
  /** Login del ERP legacy (usa email + password). */
  login: (email: string, password: string) =>
    api.post<{ token: string; user: unknown }>('/api/auth/login', { email, password }),
};
