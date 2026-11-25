/**
 * Cliente HTTP del módulo Quality Control.
 *
 * Base URL: `${EXPO_PUBLIC_API_URL}/api/quality-control`.
 * El token JWT del módulo se inyecta vía `setQcToken` (se actualiza al
 * hacer login/logout). Mismo patrón que features/pm/api/client.ts.
 */

const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'}/api/quality-control`;

export class QcApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'QcApiError';
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  noCache?: boolean;
}

/** Token de sesión del módulo (se setea al hacer login / se limpia al logout). */
let authToken: string | null = null;

const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutos

export function clearQcCache() {
  apiCache.clear();
}

export function setQcToken(token: string | null): void {
  authToken = token;
  apiCache.clear();
}

export function getQcToken(): string | null {
  return authToken;
}

async function qcFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token = authToken, noCache } = options;
  const cacheKey = `${method}:${path}`;

  if (method === 'GET' && !noCache) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T;
    }
  }

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
    throw new QcApiError(0, `No se pudo conectar con el servidor (${BASE_URL}).`);
  }

  const data = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message = (data as { error?: string; message?: string } | undefined)?.error
      ?? (data as { error?: string; message?: string } | undefined)?.message
      ?? `Error ${response.status}`;
    throw new QcApiError(response.status, message, data);
  }

  if (method === 'GET') {
    apiCache.set(cacheKey, { data, timestamp: Date.now() });
  } else {
    // Invalidar caché tras mutaciones
    apiCache.clear();
  }

  return data as T;
}

export const qcApi = {
  get: <T>(path: string, token?: string | null) => qcFetch<T>(path, { token }),
  post: <T>(path: string, body?: unknown, token?: string | null) =>
    qcFetch<T>(path, { method: 'POST', body, token }),
  put: <T>(path: string, body?: unknown, token?: string | null) =>
    qcFetch<T>(path, { method: 'PUT', body, token }),
  patch: <T>(path: string, body?: unknown, token?: string | null) =>
    qcFetch<T>(path, { method: 'PATCH', body, token }),
  delete: <T>(path: string, token?: string | null) => qcFetch<T>(path, { method: 'DELETE', token }),
};
