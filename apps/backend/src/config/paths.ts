import path from 'node:path';

/**
 * Directorio raíz de uploads.
 *
 * Por defecto: <cwd>/uploads (relativo al proceso, p. ej. apps/backend/uploads).
 * En Railway se monta un volumen persistente y se define UPLOADS_DIR
 * apuntando a la ruta del volumen (p. ej. /app/data/uploads).
 */
export const UPLOADS_DIR: string = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(process.cwd(), 'uploads');
