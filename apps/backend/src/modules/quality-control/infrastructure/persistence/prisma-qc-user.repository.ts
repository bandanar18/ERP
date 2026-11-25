import { PrismaClient, QcUserStatus } from '@prisma/client';
import {
  IQcUserRepository,
  QcPermissionItem,
  QcRoleWithPermissions,
  QcUserListItem,
  QcUserStatusValue,
} from '../../domain/repositories/qc-user.repository.js';

export class PrismaQcUserRepository implements IQcUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<QcUserListItem[]> {
    return this.prisma.qcUser.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        status: true,
        emailVerified: true,
        deletedAt: true,
        createdAt: true,
        organization: { select: { name: true } },
        qc_user_roles: { include: { role: true } },
        processAssignments: { include: { process: true } },
      },
    });
  }

  async findRoles(): Promise<QcRoleWithPermissions[]> {
    return this.prisma.qcRole.findMany({
      include: { qc_role_permissions: { include: { permission: true } } },
    });
  }

  async findPermissions(): Promise<QcPermissionItem[]> {
    return this.prisma.qcPermission.findMany({
      select: { id: true, code: true, description: true, deletedAt: true },
    });
  }

  async findRolesByCodes(codes: string[]): Promise<{ id: string; code: string }[]> {
    return this.prisma.qcRole.findMany({
      where: { code: { in: codes }, deletedAt: null },
      select: { id: true, code: true },
    });
  }

  async findRolesByIdsOrCodes(identifiers: string[]): Promise<{ id: string; code: string }[]> {
    return this.prisma.qcRole.findMany({
      where: {
        OR: [
          { id: { in: identifiers } },
          { code: { in: identifiers } },
        ],
        deletedAt: null,
      },
      select: { id: true, code: true },
    });
  }

  async replaceUserRoles(userId: string, roles: { id: string; code: string }[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.qcUserRole.deleteMany({ where: { userId } }),
      this.prisma.qcUserRole.createMany({
        data: roles.map((role) => ({ userId, roleId: role.id })),
        skipDuplicates: true,
      }),
    ]);
  }

  async findProcessesByIds(ids: string[]): Promise<{ id: string }[]> {
    return this.prisma.qcProcess.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
  }

  async replaceUserScopes(userId: string, processIds: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.qcUserProcessAssignment.deleteMany({ where: { userId } }),
      ...(processIds.length > 0
        ? [
            this.prisma.qcUserProcessAssignment.createMany({
              data: processIds.map((processId) => ({ userId, processId })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);
  }

  async findRoleById(roleId: string): Promise<{ id: string } | null> {
    return this.prisma.qcRole.findUnique({ where: { id: roleId }, select: { id: true } });
  }

  async findPermissionsByIds(ids: string[]): Promise<{ id: string }[]> {
    return this.prisma.qcPermission.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
  }

  async replaceRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.qcRolePermission.deleteMany({ where: { roleId } }),
      ...(permissionIds.length > 0
        ? [
            this.prisma.qcRolePermission.createMany({
              data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);
  }

  // ── CRUD de usuarios del módulo (solo QC_ADMIN) ───────────────────────

  async findByEmail(email: string): Promise<{ id: string } | null> {
    return this.prisma.qcUser.findUnique({ where: { email }, select: { id: true } });
  }

  async findById(id: string): Promise<{ id: string; status: QcUserStatusValue } | null> {
    return this.prisma.qcUser.findUnique({ where: { id }, select: { id: true, status: true } });
  }

  async findByUsername(username: string): Promise<{ id: string } | null> {
    return this.prisma.qcUser.findUnique({ where: { username }, select: { id: true } });
  }

  async findDefaultOrganizationId(): Promise<string | null> {
    const org = await this.prisma.qcOrganization.findFirst({
      where: { code: 'CORP_MAIN' },
      select: { id: true },
    });
    return org?.id ?? null;
  }

  async createUser(data: {
    email: string;
    password: string;
    organizationId: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    roleIds: string[];
    processIds: string[];
  }): Promise<{ id: string }> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.qcUser.create({
        data: {
          email: data.email,
          password: data.password,
          organizationId: data.organizationId,
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          status: 'ACTIVE',
          emailVerified: true, // creado por el admin: no requiere OTP
        },
        select: { id: true },
      });

      await tx.qcUserRole.createMany({
        data: data.roleIds.map((roleId) => ({ userId: user.id, roleId })),
        skipDuplicates: true,
      });

      if (data.processIds.length > 0) {
        await tx.qcUserProcessAssignment.createMany({
          data: data.processIds.map((processId) => ({ userId: user.id, processId })),
          skipDuplicates: true,
        });
      }

      return user;
    });
  }

  async updateProfile(
    userId: string,
    data: { firstName?: string | null; lastName?: string | null; username?: string | null }
  ): Promise<void> {
    await this.prisma.qcUser.update({
      where: { id: userId },
      data: {
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.username !== undefined ? { username: data.username } : {}),
      },
    });
  }

  async updateStatus(userId: string, status: QcUserStatus): Promise<void> {
    await this.prisma.qcUser.update({ where: { id: userId }, data: { status } });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.prisma.qcUser.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async softDelete(userId: string): Promise<void> {
    await this.prisma.qcUser.update({
      where: { id: userId },
      data: { status: QcUserStatus.INACTIVE, deletedAt: new Date() },
    });
  }
}
