/**
 * Utilidad de resolución de URLs multimedia para la app móvil.
 * Resuelve discrepancias entre localhost (guardado en BD al subir desde el navegador web)
 * y el host accesible desde el emulador Android (10.0.2.2), simulador iOS o dispositivo físico.
 */

export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== 'string') return undefined;

  const trimmed = url.trim();
  if (!trimmed) return undefined;

  const apiBase = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
  // Extraer el origen base (ej. "http://10.0.2.2:3000" o "http://localhost:3000")
  const origin = apiBase.replace(/^(https?:\/\/[^/]+).*/, '$1');

  // Si es una ruta relativa (/uploads/...)
  if (trimmed.startsWith('/')) {
    return `${origin}${trimmed}`;
  }

  // Si la URL viene guardada con localhost:3000 o 127.0.0.1:3000 desde el backend local,
  // la adaptamos al host real con el que la app móvil se conecta al backend
  if (trimmed.includes('localhost:3000') || trimmed.includes('127.0.0.1:3000')) {
    return trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1):3000/, origin);
  }

  return trimmed;
}
