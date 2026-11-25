import { apiFetch } from "./api-client";
import type { QcPermissionItem, QcRoleWithPermissions, QcUserListItem } from "../types";

export const userApi = {
  list: () => apiFetch<QcUserListItem[]>("/users"),
  roles: () => apiFetch<QcRoleWithPermissions[]>("/users/roles"),
  permissions: () => apiFetch<QcPermissionItem[]>("/users/permissions"),
  updateUserRoles: (userId: string, roles: string[]) =>
    apiFetch<{ success: boolean }>(`/users/${userId}/roles`, {
      method: "PATCH",
      body: JSON.stringify({ roles }),
    }),
  updateUserScopes: (userId: string, processIds: string[]) =>
    apiFetch<{ success: boolean }>(`/users/${userId}/scopes`, {
      method: "PATCH",
      body: JSON.stringify({ processIds }),
    }),
  updateRolePermissions: (roleId: string, permissionIds: string[]) =>
    apiFetch<{ success: boolean }>(`/users/roles/${roleId}/permissions`, {
      method: "PATCH",
      body: JSON.stringify({ permissionIds }),
    }),
  // ── CRUD de usuarios del módulo (solo QC_ADMIN) ──
  create: (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    roleCodes: string[];
    processIds: string[];
  }) =>
    apiFetch<{ success: boolean; id: string }>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProfile: (userId: string, data: { firstName?: string | null; lastName?: string | null; username?: string | null }) =>
    apiFetch<{ success: boolean }>(`/users/${userId}/profile`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  toggleActive: (userId: string) =>
    apiFetch<{ success: boolean; status: string }>(`/users/${userId}/toggle-active`, {
      method: "PATCH",
    }),
  resetPassword: (userId: string, newPassword: string) =>
    apiFetch<{ success: boolean }>(`/users/${userId}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    }),
  remove: (userId: string) =>
    apiFetch<{ success: boolean }>(`/users/${userId}`, {
      method: "DELETE",
    }),
};
