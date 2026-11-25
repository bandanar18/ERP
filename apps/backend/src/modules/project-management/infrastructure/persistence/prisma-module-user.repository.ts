import { PrismaClient } from '@prisma/client';
import { IModuleUserRepository } from '../../domain/repositories/module-user.repository.js';
import { PmUser } from '../../domain/entities/module-user.entity.js';
import * as bcrypt from 'bcryptjs';

export class PrismaModuleUserRepository implements IModuleUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(filters?: { role?: string }): Promise<PmUser[]> {
    const where: any = {};
    if (filters?.role) {
      where.pm_user_roles = {
        some: {
          pm_roles: {
            code: filters.role
          }
        }
      };
    }
    
    const users = await this.prisma.pmModuleUser.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        externalId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        pm_user_roles: {
          include: {
            pm_roles: true
          }
        },
        scopes: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return users as unknown as PmUser[];
  }

  async findById(id: string): Promise<PmUser | null> {
    const user = await this.prisma.pmModuleUser.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        externalId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        pm_user_roles: {
          include: {
            pm_roles: true
          }
        },
        scopes: true
      }
    });
    return user as unknown as PmUser | null;
  }

  async updateRole(id: string, roleCode: string): Promise<PmUser> {
    const role = await this.prisma.pmRole.findUnique({
      where: { code: roleCode }
    });

    if (!role) {
      throw new Error(`Role ${roleCode} not found`);
    }

    await this.prisma.pmUserRole.deleteMany({
      where: { userId: id }
    });

    await this.prisma.pmUserRole.create({
      data: {
        userId: id,
        roleId: role.id
      }
    });

    return this.findById(id) as Promise<PmUser>;
  }

  async updateScopes(id: string, scopes: { companyId?: string | null; projectId?: string | null }[]): Promise<PmUser> {
    await this.prisma.pmUserScope.deleteMany({
      where: { userId: id }
    });

    if (scopes.length > 0) {
      await this.prisma.pmUserScope.createMany({
        data: scopes.map(scope => ({
          userId: id,
          companyId: scope.companyId ?? null,
          projectId: scope.projectId ?? null
        }))
      });
    }

    return this.findById(id) as Promise<PmUser>;
  }

  async toggleActive(id: string): Promise<PmUser> {
    const user = await this.prisma.pmModuleUser.findUnique({ where: { id } });
    if (!user) {
      throw new Error(`User ${id} not found`);
    }
    await this.prisma.pmModuleUser.update({
      where: { id },
      data: { status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
    });
    return this.findById(id) as Promise<PmUser>;
  }

  async listRoles(): Promise<{ id: string; code: string; description: string | null }[]> {
    return this.prisma.pmRole.findMany({
      select: { id: true, code: true, description: true },
      orderBy: { code: 'asc' },
    });
  }

  async create(data: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    roleCode: string;
    scopes?: { companyId?: string | null; projectId?: string | null }[];
  }): Promise<PmUser> {
    // Generar contraseña temporal y hashearla
    const temporaryPassword = 'Temp' + Math.random().toString(36).slice(2, 10) + '!A1';
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const role = await this.prisma.pmRole.findUnique({
      where: { code: data.roleCode }
    });
    if (!role) {
      throw new Error(`Role ${data.roleCode} not found`);
    }

    const user = await this.prisma.pmModuleUser.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        status: 'ACTIVE',
        emailVerified: true,
        pm_user_roles: {
          create: [{ roleId: role.id }]
        },
        scopes: {
          create: (data.scopes ?? []).map(s => ({
            companyId: s.companyId ?? null,
            projectId: s.projectId ?? null
          }))
        }
      }
    });

    return this.findById(user.id) as Promise<PmUser>;
  }
}
