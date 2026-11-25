import { getPmToken, PmApiError } from './client';
import type { FileListResponse, GalleryFile } from '../types';

/**
 * Servicio de galería de archivos del módulo PM.
 * Usa el endpoint legacy del ERP (`/api/file-gallery/*`) con el token del módulo.
 *
 * entityType soportado por el backend: 'Project' | 'Company' | 'User'.
 */
const API_BASE = `${process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'}/api/file-gallery`;

async function galleryFetch<T>(
  path: string,
  method: 'GET' | 'DELETE' = 'GET',
): Promise<T> {
  const token = getPmToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { method, headers });
  } catch {
    throw new PmApiError(0, `No se pudo conectar con el servidor (${API_BASE}).`);
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

/**
 * Sube un archivo vía multipart/form-data.
 * NO se setea Content-Type manualmente (el navegador/RN agrega el boundary).
 */
async function galleryUpload(
  entityType: string,
  entityId: string,
  file: File | { uri: string; name: string; type: string },
  meta: { description?: string; category?: string } = {},
): Promise<{ file: GalleryFile; message: string }> {
  const token = getPmToken();
  const formData = new FormData();
  formData.append('file', file as any);
  if (meta.description) formData.append('description', meta.description);
  if (meta.category) formData.append('category', meta.category);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/${entityType}/${entityId}`, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch {
    throw new PmApiError(0, `No se pudo conectar con el servidor (${API_BASE}).`);
  }

  const data = await response.json().catch(() => undefined);
  if (!response.ok) {
    const message =
      (data as { error?: string; message?: string } | undefined)?.error ??
      (data as { error?: string; message?: string } | undefined)?.message ??
      `Error ${response.status}`;
    throw new PmApiError(response.status, message, data);
  }

  return data as { file: GalleryFile; message: string };
}

export const galleryService = {
  getFiles: (entityType: string, entityId: string) =>
    galleryFetch<FileListResponse>(`/${entityType}/${entityId}`),

  upload: galleryUpload,

  remove: (id: string) => galleryFetch<{ message: string }>(`/file/${id}`, 'DELETE'),

  /** URL de descarga directa (para abrir/descargar archivos sin `url`). */
  downloadUrl: (id: string) => `${API_BASE}/download/${id}`,
};