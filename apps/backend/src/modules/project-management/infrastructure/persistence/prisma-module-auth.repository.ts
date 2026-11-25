import { PrismaClient, PmModuleUser } from '@prisma/client';
import { IModuleAuthRepository } from '../../domain/repositories/module-auth.repository.js';
import { PmProfile } from '../../application/dto/auth.dto.js';

export class PrismaModuleAuthRepository implements IModuleAuthRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByEmail(email: string): Promise<PmModuleUser | null> {
    // Búsqueda case-insensitive: el login no debe fallar si el usuario escribe
    // el email con otra capitalización (la columna es @unique en minúsculas).
    return this.db.pmModuleUser.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
  }

  async findByUsername(username: string): Promise<PmModuleUser | null> {
    return this.db.pmModuleUser.findUnique({
      where: { username },
    });
  }

  async findById(id: string): Promise<PmModuleUser | null> {
    return this.db.pmModuleUser.findUnique({
      where: { id },
    });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.db.pmModuleUser.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async findProfile(userId: string): Promise<PmProfile | null> {
    const user = await this.db.pmModuleUser.findUnique({
      where: { id: userId, status: 'ACTIVE' },
      include: {
        pm_user_roles: {
          include: {
            pm_roles: {
              include: {
                pm_role_permissions: {
                  include: {
                    pm_permissions: true,
                  },
                },
              },
            },
          },
        },
        scopes: true,
      },
    });

    if (!user) return null;

    const roles = user.pm_user_roles.map((ur) => ur.pm_roles.code);

    const permissionsSet = new Set<string>();
    user.pm_user_roles.forEach((ur) => {
      ur.pm_roles.pm_role_permissions.forEach((rp) => {
        permissionsSet.add(rp.pm_permissions.code);
      });
    });

    const companyIds = user.scopes.map((s) => s.companyId).filter((id): id is string => id !== null);
    const projectIds = user.scopes.map((s) => s.projectId).filter((id): id is string => id !== null);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      createdAt: user.createdAt.toISOString(),
      roles,
      permissions: Array.from(permissionsSet),
      scopes: {
        companyIds,
        projectIds,
      },
    };
  }

  async updateProfile(
    userId: string,
    data: { firstName?: string | null; lastName?: string | null; username?: string | null; phone?: string | null },
  ): Promise<PmProfile | null> {
    const update: { firstName?: string | null; lastName?: string | null; username?: string | null; phone?: string | null } = {};
    if (data.firstName !== undefined) update.firstName = data.firstName;
    if (data.lastName !== undefined) update.lastName = data.lastName;
    if (data.username !== undefined) update.username = data.username;
    if (data.phone !== undefined) update.phone = data.phone;

    if (Object.keys(update).length === 0) {
      return this.findProfile(userId);
    }

    await this.db.pmModuleUser.update({ where: { id: userId }, data: update });
    return this.findProfile(userId);
  }

  async linkExternalId(pmUserId: string, erpUserId: string): Promise<void> {
    await this.db.pmModuleUser.update({
      where: { id: pmUserId },
      data: { externalId: erpUserId },
    });
  }

  async create(data: {
    email: string;
    password: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    status?: string;
    emailVerified?: boolean;
  }): Promise<PmModuleUser> {
    return this.db.pmModuleUser.create({
      data: {
        email: data.email,
        password: data.password,
        username: data.username ?? null,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        status: data.status ?? 'ACTIVE',
        emailVerified: data.emailVerified ?? false,
      },
    });
  }
}
