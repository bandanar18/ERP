import { Prisma } from '@prisma/client';
import { QcUserStatus } from '@prisma/client';

export type QcUserStatusValue = QcUserStatus;

/** Usuario del módulo para listado admin (org, roles y procesos asignados). */
export type QcUserListItem = Prisma.QcUserGetPayload<{
  select: {
    id: true;
    email: true;
    firstName: true;
    lastName: true;
    username: true;
    status: true;
    emailVerified: true;
    deletedAt: true;
    createdAt: true;
    organization: { select: { name: true } };
    qc_user_roles: { include: { role: true } };
    processAssignments: { include: { process: true } };
  };
}>;

/** Rol del módulo con sus permisos. */
export type QcRoleWithPermissions = Prisma.QcRoleGetPayload<{
  include: { qc_role_permissions: { include: { permission: true } } };
}>;

export type QcPermissionItem = Prisma.QcPermissionGetPayload<{
  select: { id: true; code: true; description: true; deletedAt: true };
}>;

export interface IQcUserRepository {
  findAll(): Promise<QcUserListItem[]>;
  findRoles(): Promise<QcRoleWithPermissions[]>;
  findPermissions(): Promise<QcPermissionItem[]>;
  findRolesByCodes(codes: string[]): Promise<{ id: string; code: string }[]>;
  findRolesByIdsOrCodes(identifiers: string[]): Promise<{ id: string; code: string }[]>;
  replaceUserRoles(userId: string, roles: { id: string; code: string }[]): Promise<void>;
  findProcessesByIds(ids: string[]): Promise<{ id: string }[]>;
  replaceUserScopes(userId: string, processIds: string[]): Promise<void>;
  findRoleById(roleId: string): Promise<{ id: string } | null>;
  findPermissionsByIds(ids: string[]): Promise<{ id: string }[]>;
  replaceRolePermissions(roleId: string, permissionIds: string[]): Promise<void>;
  // ── CRUD de usuarios del módulo (solo QC_ADMIN) ──
  findByEmail(email: string): Promise<{ id: string } | null>;
  findById(id: string): Promise<{ id: string; status: QcUserStatusValue } | null>;
  findByUsername(username: string): Promise<{ id: string } | null>;
  findDefaultOrganizationId(): Promise<string | null>;
  createUser(data: {
    email: string;
    password: string;
    organizationId: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    roleIds: string[];
    processIds: string[];
  }): Promise<{ id: string }>;
  updateProfile(
    userId: string,
    data: { firstName?: string | null; lastName?: string | null; username?: string | null }
  ): Promise<void>;
  updateStatus(userId: string, status: QcUserStatusValue): Promise<void>;
  updatePassword(userId: string, hashedPassword: string): Promise<void>;
  softDelete(userId: string): Promise<void>;
}
