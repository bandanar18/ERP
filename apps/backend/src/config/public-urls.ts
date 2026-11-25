/**
 * Orígenes públicos del frontend para links en emails (reset de contraseña, etc.).
 * Espejo de apps/frontend/src/config/domains.ts.
 *
 * Si FRONTEND_URL / PM_FRONTEND_URL / QC_FRONTEND_URL apuntan a localhost,
 * se ignora y se usa el dominio de producción: un link localhost en el correo
 * no sirve fuera de la máquina que lo generó.
 */

const LANDING_PUBLIC_URL = 'https://bdgestion.org';
const PM_PUBLIC_URL = 'https://proyectos.bdgestion.org';
const QC_PUBLIC_URL = 'https://calidad.bdgestion.org';

function isLocalOrigin(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

function resolveOrigin(envValue: string | undefined, fallback: string): string {
  const value = (envValue || '').trim().replace(/\/$/, '');
  if (!value || isLocalOrigin(value)) return fallback;
  return value;
}

/** Apex / auth legacy (landing). */
export function getAuthFrontendOrigin(): string {
  return resolveOrigin(process.env.FRONTEND_URL, LANDING_PUBLIC_URL);
}

/** Subdominio de Project Management. */
export function getPmFrontendOrigin(): string {
  return resolveOrigin(
    process.env.PM_FRONTEND_URL || process.env.FRONTEND_URL,
    PM_PUBLIC_URL,
  );
}

/** Subdominio de Quality Control. */
export function getQcFrontendOrigin(): string {
  return resolveOrigin(
    process.env.QC_FRONTEND_URL || process.env.FRONTEND_URL,
    QC_PUBLIC_URL,
  );
}
