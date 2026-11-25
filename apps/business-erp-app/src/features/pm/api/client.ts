/**
 * Cliente HTTP del módulo Project Management.
 *
 * Base URL: `${EXPO_PUBLIC_API_URL}/api/project-management`.
 * El token JWT se inyecta vía `setPmToken` (se actualiza al hacer login/logout).
 */

const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'}/api/project-management`;

export class PmApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'PmApiError';
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, PmApiError.prototype);
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
}

/** Token de sesión del módulo (se setea al hacer login / se limpia al logout). */
let authToken: string | null = null;

export function setPmToken(token: string | null): void {
  authToken = token;
}

export function getPmToken(): string | null {
  return authToken;
}

async function pmFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token = authToken } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new PmApiError(0, `No se pudo conectar con el servidor (${BASE_URL}).`);
  }

  const data = await response.json().catch(() => undefined);

  if (!response.ok) {
    let message = (data as { error?: string; message?: string | string[] } | undefined)?.message
      ?? (data as { error?: string; message?: string } | undefined)?.error
      ?? `Error ${response.status}`;
      
    if (Array.isArray(message)) {
      message = message.join(', ');
    }
    
    throw new PmApiError(response.status, message, data);
  }

  return data as T;
}

export const pmApi = {
  get: <T>(path: string, token?: string | null) => pmFetch<T>(path, { token }),
  post: <T>(path: string, body?: unknown, token?: string | null) =>
    pmFetch<T>(path, { method: 'POST', body, token }),
  put: <T>(path: string, body?: unknown, token?: string | null) =>
    pmFetch<T>(path, { method: 'PUT', body, token }),
  patch: <T>(path: string, body?: unknown, token?: string | null) =>
    pmFetch<T>(path, { method: 'PATCH', body, token }),
  delete: <T>(path: string, token?: string | null) => pmFetch<T>(path, { method: 'DELETE', token }),
};
