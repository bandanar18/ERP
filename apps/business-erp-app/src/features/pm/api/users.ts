import { erpFetch } from './http';
import type { ModuleUser, RegisterDto, RoleOption, User, UserListResponse } from '../types';

/**
 * Servicio de gestión de usuarios del módulo PM.
 * Espeja `userService` del frontend web (`/api/user-management/*`):
 * listado con búsqueda + paginación, roles, cambio de rol/empresa y
 * activar/desactivar.
 */
const BASE = '/api/user-management';

export const userService = {
  /** GET /api/user-management?search=&page=&limit= → { data, meta } */
  getAllManagement: (search = '', page = 1, limit = 12) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('page', String(page));
    params.append('limit', String(limit));
    return erpFetch<UserListResponse>(BASE, `?${params.toString()}`);
  },

  /** GET /api/user-management/roles → [{ id, name, description? }] */
  getRoles: () => erpFetch<RoleOption[]>(BASE, '/roles'),

  /** PUT /api/user-management/:id/role  { roleId } */
  updateRole: (id: string, roleId: string | null) =>
    erpFetch<User>(BASE, `/${id}/role`, 'PUT', { roleId }),

  /** PUT /api/user-management/:id/company  { companyId } */
  updateCompany: (id: string, companyId: string | null) =>
    erpFetch<User>(BASE, `/${id}/company`, 'PUT', { companyId }),

  /** PUT /api/user-management/:id/toggle-active */
  toggleActive: (id: string) => erpFetch<User>(BASE, `/${id}/toggle-active`, 'PUT'),
};

/**
 * Servicio de usuarios del MÓDULO PM (tabla pm_module_user) — los que
 * loguean al módulo. Expone los endpoints `/api/project-management/*`:
 * listado con rol PM, cambio de rol, scopes (empresa) y activar/desactivar.
 * Las mutaciones exigen PM_ADMIN o PM_GESTION en el backend.
 */
const PM_BASE = '/api/project-management';

export const moduleUserService = {
  /** GET /api/project-management/module-users?role= → ModuleUser[] (todos, sin paginar) */
  getAll: (role?: string) =>
    erpFetch<ModuleUser[]>(PM_BASE, `/module-users${role ? `?role=${encodeURIComponent(role)}` : ''}`),

  /** PATCH /api/project-management/module-users/:id/role { roleCode } — PM_ADMIN | PM_GESTION */
  updateRole: (id: string, roleCode: string) =>
    erpFetch<ModuleUser>(PM_BASE, `/module-users/${id}/role`, 'PATCH', { roleCode }),

  /** PATCH /api/project-management/module-users/:id/scopes { scopes } — PM_ADMIN | PM_GESTION (reemplaza todos) */
  updateScopes: (id: string, scopes: { companyId: string | null; projectId: string | null }[]) =>
    erpFetch<ModuleUser>(PM_BASE, `/module-users/${id}/scopes`, 'PATCH', { scopes }),

  /** PATCH /api/project-management/module-users/:id/toggle-active — PM_ADMIN | PM_GESTION */
  toggleActive: (id: string) =>
    erpFetch<ModuleUser>(PM_BASE, `/module-users/${id}/toggle-active`, 'PATCH'),

  /** POST /api/project-management/auth/register — crea un usuario del módulo (sin rol) */
  register: (dto: RegisterDto) =>
    erpFetch<{ success: boolean; message?: string; error?: string }>(PM_BASE, '/auth/register', 'POST', dto),
};