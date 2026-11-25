/**
 * MÓDULO EJECUTIVO — Tipos públicos de la API.
 *
 * El módulo es INDEPENDIENTE del ERP: su JWT, roles y scopes no tienen
 * relación con los del ERP.
 */

/** Payload del access token del módulo (firmado con EXECUTIVE_JWT_SECRET). */
export interface ExecutiveTokenPayload {
  sub: string;
  email: string;
}

/** Scopes (procesos/subprocesos/proyectos) asignados a un usuario del módulo. */
export interface ExecutiveScopes {
  processes: string[];
  subprocesses: string[];
  projects: string[];
}

/**
 * Perfil enriquecido del usuario del módulo. Se reconstruye desde la BD en
 * cada request (como el authMiddleware del ERP) para no confiar en claims
 * de un token que puedan estar desactualizados.
 */
export interface ExecutiveProfile {
  id: string;
  email: string;
  organizationId: string;
  status: string;
  roles: string[];
  permissions: string[];
  scopes: ExecutiveScopes;
  /** Campos adicionales del usuario (createdAt, externalId, etc.) */
  [key: string]: unknown;
}

/** Respuesta de login/register del módulo. */
export interface ExecutiveAuthResponse {
  accessToken: string;
  user: Record<string, unknown> & {
    roles: string[];
    permissions: string[];
    scopes: ExecutiveScopes;
  };
  redirectUrl: string;
}

/** Estado del semáforo. */
export type TrafficLightValue = 'GREEN' | 'RED' | 'GRAY';
