import { qcApi } from './client';

export interface QcUserListItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  status: string;
  emailVerified: boolean;
  deletedAt: string | null;
  createdAt: string;
  organization: { name: string };
  qc_user_roles: Array<{ role: { id: string; code: string; description: string | null } }>;
  processAssignments: Array<{ process: { id: string; code: string; name: string } }>;
}

export interface QcRoleWithPermissions {
  id: string;
  code: string;
  description: string | null;
  qc_role_permissions: Array<{ permission: { id: string; code: string; description: string | null } }>;
}

export interface QcPermissionItem {
  id: string;
  code: string;
  description: string | null;
}

export const userApi = {
  list: () => qcApi.get<QcUserListItem[]>('/users'),
  roles: () => qcApi.get<QcRoleWithPermissions[]>('/users/roles'),
  permissions: () => qcApi.get<QcPermissionItem[]>('/users/permissions'),
  create: (payload: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    roleCodes: string[];
    processIds: string[];
  }) => qcApi.post<QcUserListItem>('/users', payload),
  updateProfile: (id: string, payload: { firstName: string | null; lastName: string | null; username: string | null }) =>
    qcApi.patch<QcUserListItem>(`/users/${id}/profile`, payload),
  toggleActive: (id: string) => qcApi.patch<{ status: string }>(`/users/${id}/toggle-active`),
  resetPassword: (id: string, newPassword: string) =>
    qcApi.post(`/users/${id}/reset-password`, { newPassword }),
  remove: (id: string) => qcApi.delete(`/users/${id}`),
  updateUserRoles: (id: string, roles: string[]) =>
    qcApi.patch(`/users/${id}/roles`, { roles, roleIds: roles }),
  updateUserScopes: (id: string, processIds: string[]) =>
    qcApi.patch(`/users/${id}/scopes`, { processIds }),
  updateRolePermissions: (roleId: string, permissionIds: string[]) =>
    qcApi.patch(`/users/roles/${roleId}/permissions`, { permissionIds }),
};
