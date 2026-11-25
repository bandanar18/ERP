/**
 * Configuración de dominios y subdominios del ERP.
 *
 * La landing vive en el apex (bdgestion.org y www.bdgestion.org). Cada módulo
 * tiene su propio subdominio, y el SPA detecta el hostname al arrancar para
 * montar el módulo correspondiente directamente (sin pasar por la landing).
 *
 * NOTA: las rutas internas de cada módulo usan un prefijo (p. ej.
 * `/project-management/login`) hardcodeado en decenas de componentes. Para no
 * reescribirlas, el módulo conserva su prefijo también en el subdominio, y la
 * raíz del subdominio redirige al login. Así `proyectos.bdgestion.org` abre
 * directo `proyectos.bdgestion.org/project-management/login`.
 *
 * Para cambiar de dominio, editá este archivo y re-deployá el frontend.
 */

export type ModuleKey = "project-management" | "quality-control";

/** Subdominio → módulo que debe montarse en ese host. */
export const MODULE_SUBDOMAINS: Record<string, ModuleKey> = {
  "proyectos.bdgestion.org": "project-management",
  "calidad.bdgestion.org": "quality-control",
};

/** URL pública absoluta (raíz) de cada subdominio de módulo. */
export const MODULE_PUBLIC_URLS: Record<ModuleKey, string> = {
  "project-management": "https://proyectos.bdgestion.org",
  "quality-control": "https://calidad.bdgestion.org",
};

/** Dominio raíz (apex) de la landing. */
export const LANDING_DOMAIN = "bdgestion.org";

/** Prefijo de ruta interno de cada módulo (igual en apex y subdominio). */
function moduleBasePath(module: ModuleKey): string {
  return module === "project-management" ? "/project-management" : "/quality-control";
}

/** ¿Estamos en un entorno local (dev)? */
export function isLocalHost(hostname: string = window.location.hostname): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local")
  );
}

/** Módulo activo según el subdominio actual (null si es la landing/apex). */
export function getActiveModule(
  hostname: string = window.location.hostname
): ModuleKey | null {
  return MODULE_SUBDOMAINS[hostname.toLowerCase()] ?? null;
}

/**
 * Link raíz a un módulo desde la landing. En producción devuelve la URL del
 * subdominio (que redirige al login); en local devuelve el prefijo interno.
 */
export function moduleLink(module: ModuleKey): string {
  if (isLocalHost()) return moduleBasePath(module);
  return MODULE_PUBLIC_URLS[module];
}

/** Link directo al login de un módulo (en producción apunta al subdominio). */
export function moduleLoginLink(module: ModuleKey): string {
  const path = `${moduleBasePath(module)}/login`;
  if (isLocalHost()) return path;
  return `${MODULE_PUBLIC_URLS[module]}${path}`;
}
