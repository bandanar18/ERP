import { getPmToken, PmApiError } from './client';
import { clearQueryCache } from '@/hooks/useCachedQuery';

const API_ORIGIN = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * Fetch genérico contra los endpoints legacy del ERP (/api/*) con el token del módulo.
 * `base` es la ruta base (p. ej. '/api/physical-progress').
 */
export async function erpFetch<T>(
  base: string,
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown,
): Promise<T> {
  const token = getPmToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response: Response;
  try {
    if (method !== 'GET') {
      clearQueryCache();
    }
    response = await fetch(`${API_ORIGIN}${base}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new PmApiError(0, `No se pudo conectar con el servidor (${API_ORIGIN}${base}).`);
  }

  const data = await response.json().catch(() => undefined);
  if (!response.ok) {
    const message =
      (data as { error?: string; message?: string } | undefined)?.error ??
      (data as { error?: string; message?: string } | undefined)?.message ??
      `Error ${response.status}`;
    throw new PmApiError(response.status, message, data);
  }

  return data as T;
}
