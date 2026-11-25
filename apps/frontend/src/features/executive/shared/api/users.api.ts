import { apiFetch } from './api-client';
import { apiUrl } from './config';

/* ─── Interfaces ─── */

export interface Role {
  id: string;
  code: string;
  description: string;
  permissions?: { permission: Pick<Permission, 'id' | 'code' | 'description'> }[];
}

export interface UserRole {
  role: Role;
}

export interface Permission {
  id: string;
  code: string;
  description: string;
}

export interface ProcessInfo {
  id: string;
  name: string;
  code: string;
}

export interface UserProcessAssignment {
  process: ProcessInfo;
}

export interface User {
  id: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  organization?: { id: string; name: string };
  roles: UserRole[];
  processAssignments: UserProcessAssignment[];
}

export type CreateUserDto = {
  email: string;
  password: string;
  roles: string[];
  processIds?: string[];
};

export type UpdateUserRolesDto = {
  roles: string[];
};

export type UpdateUserScopesDto = {
  processIds: string[];
};

export type UpdateRolePermissionsDto = {
  permissionIds: string[];
};

/* ─── API Methods ─── */

export const usersApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiFetch(apiUrl('/users'), undefined, { silent: true });
    return response.json();
  },

  getRoles: async (): Promise<Role[]> => {
    const response = await apiFetch(apiUrl('/users/roles'), undefined, { silent: true });
    return response.json();
  },

  getPermissions: async (): Promise<Permission[]> => {
    const response = await apiFetch(apiUrl('/users/permissions'), undefined, { silent: true });
    return response.json();
  },

  updateUserRoles: async (userId: string, roles: string[]): Promise<{ success: boolean }> => {
    const response = await apiFetch(apiUrl(`/users/${userId}/roles`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles } satisfies UpdateUserRolesDto),
    }, { silent: true });
    return response.json();
  },

  updateUserScopes: async (userId: string, processIds: string[]): Promise<{ success: boolean }> => {
    const response = await apiFetch(apiUrl(`/users/${userId}/scopes`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processIds } satisfies UpdateUserScopesDto),
    }, { silent: true });
    return response.json();
  },

  updateRolePermissions: async (roleId: string, permissionIds: string[]): Promise<{ success: boolean }> => {
    const response = await apiFetch(apiUrl(`/users/roles/${roleId}/permissions`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissionIds } satisfies UpdateRolePermissionsDto),
    }, { silent: true });
    return response.json();
  },
};

/* ─── Processes API (re-exported for convenience) ─── */

export const processesApi = {
  getAll: async (): Promise<ProcessInfo[]> => {
    const response = await apiFetch(apiUrl('/processes'));
    return response.json();
  },
};
