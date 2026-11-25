import { PrismaClient, QcUser } from '@prisma/client';
import { IQcAuthRepository } from '../../domain/repositories/qc-auth.repository.js';
import { QcProfile } from '../../application/dto/qc-auth.dto.js';

export class PrismaQcAuthRepository implements IQcAuthRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByEmail(email: string): Promise<QcUser | null> {
    // Búsqueda case-insensitive: el login no debe fallar si el usuario escribe
    // el email con otra capitalización (la columna es @unique en Postgres).
    return this.db.qcUser.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
  }

  async findByUsername(username: string): Promise<QcUser | null> {
    return this.db.qcUser.findUnique({
      where: { username },
    });
  }

  async findById(id: string): Promise<QcUser | null> {
    return this.db.qcUser.findUnique({
      where: { id },
    });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.db.qcUser.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async findProfile(userId: string): Promise<QcProfile | null> {
    const user = await this.db.qcUser.findUnique({
      where: { id: userId, status: 'ACTIVE' },
      include: {
        qc_user_roles: {
          include: {
            role: {
              include: {
                qc_role_permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        processAssignments: true,
      },
    });

    if (!user) return null;

    const roles = user.qc_user_roles.map((ur) => ur.role.code);

    const permissionsSet = new Set<string>();
    user.qc_user_roles.forEach((ur) => {
      ur.role.qc_role_permissions.forEach((rp) => {
        permissionsSet.add(rp.permission.code);
      });
    });

    const processIds = Array.from(new Set(user.processAssignments.map((a) => a.processId)));
    const subprocessIds = Array.from(
      new Set(user.processAssignments.map((a) => a.subprocessId).filter((id): id is string => id !== null)),
    );
    const projectIds = Array.from(
      new Set(user.processAssignments.map((a) => a.projectId).filter((id): id is string => id !== null)),
    );

    return {
      id: user.id,
      email: user.email,
      roles,
      permissions: Array.from(permissionsSet),
      scopes: {
        processIds,
        subprocessIds,
        projectIds,
      },
    };
  }

  async linkExternalId(qcUserId: string, erpUserId: string): Promise<void> {
    await this.db.qcUser.update({
      where: { id: qcUserId },
      data: { externalId: erpUserId },
    });
  }

  async findDefaultOrganizationId(): Promise<string | null> {
    const org = await this.db.qcOrganization.findFirst({
      where: { code: 'CORP_MAIN' },
      select: { id: true },
    });
    return org?.id ?? null;
  }

  async findRoleIdByCode(code: string): Promise<string | null> {
    const role = await this.db.qcRole.findUnique({
      where: { code },
      select: { id: true },
    });
    return role?.id ?? null;
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    await this.db.qcUserRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    });
  }

  async create(data: {
    email: string;
    password: string;
    organizationId: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    status?: QcUser['status'];
    emailVerified?: boolean;
  }): Promise<QcUser> {
    return this.db.qcUser.create({
      data: {
        email: data.email,
        password: data.password,
        organizationId: data.organizationId,
        username: data.username ?? null,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        status: data.status ?? 'ACTIVE',
        emailVerified: data.emailVerified ?? false,
      },
    });
  }
}
