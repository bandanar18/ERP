/**
 * Base de la API del servicio Executive.
 * En desarrollo se resuelve vía el proxy de Vite (/api/executive → localhost:3000, ERP).
 * En producción se puede override con VITE_EXECUTIVE_API_BASE.
 */
export const API_BASE = import.meta.env.VITE_EXECUTIVE_API_BASE ?? '/api/executive';

/** Construye una URL de la API a partir de un path relativo al recurso. */
export const apiUrl = (path: string) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
