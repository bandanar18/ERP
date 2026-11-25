import { ErpUser, ErpRole, PmCompany } from '@prisma/client';
import { RegisterRequest, AssignRequest } from '../interfaces';
import { prisma } from '@/config/database';

export type UserWithPassword = ErpUser & {
  password: string;
  role?: ErpRole | null;
  company?: PmCompany | null;
};

export type UserWithRelations = ErpUser & {
  role?: ErpRole | null;
  company?: PmCompany | null;
};

export class AuthRepository {
  async findByEmail(email: string): Promise<UserWithPassword | null> {
    return prisma.erpUser.findUnique({
      where: { email },
      include: { role: true, company: true },
    }) as Promise<UserWithPassword | null>;
  }

  async findById(id: string): Promise<UserWithRelations | null> {
    return prisma.erpUser.findUnique({
      where: { id },
      include: { role: true, company: true },
    }) as Promise<UserWithRelations | null>;
  }

  async findRoleByName(name: string): Promise<ErpRole | null> {
    return prisma.erpRole.findUnique({
      where: { name },
    });
  }

  async create(data: RegisterRequest & { password: string; roleId?: string | null; companyId?: string }): Promise<UserWithPassword> {
    return prisma.erpUser.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        roleId: data.roleId ?? null,
        companyId: data.companyId ?? null,
      },
      include: { role: true, company: true },
    }) as Promise<UserWithPassword>;
  }

  async updateLastLogin(id: string): Promise<void> {
    await prisma.erpUser.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
  }

  async verifyEmail(id: string): Promise<UserWithRelations> {
    return prisma.erpUser.update({
      where: { id },
      data: { emailVerified: true },
      include: { role: true, company: true },
    }) as Promise<UserWithRelations>;
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await prisma.erpUser.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async assignRoleAndCompany(userId: string, data: AssignRequest & { roleId?: string | null }): Promise<UserWithRelations> {
    const updateData: Record<string, any> = {};

    if (data.roleId !== undefined) {
      updateData.roleId = data.roleId;
    }

    if (data.companyId !== undefined) {
      updateData.companyId = data.companyId;
    }

    return prisma.erpUser.update({
      where: { id: userId },
      data: updateData,
      include: { role: true, company: true },
    }) as Promise<UserWithRelations>;
  }

  async createDefaultRoles(): Promise<void> {
    const existingRoles = await prisma.erpRole.count();

    if (existingRoles === 0) {
      await prisma.erpRole.createMany({
        data: [
          { name: 'USER' },
          { name: 'ADMIN' },
          { name: 'CLIENT' },
        ],
      });
    }
  }

  async findCompanyById(id: string): Promise<PmCompany | null> {
    return prisma.pmCompany.findUnique({
      where: { id },
    });
  }

  /**
   * Verifica si el usuario está activo.
   * Retorna true si el usuario existe y está activo, false en caso contrario.
   */
  async isUserActive(userId: string): Promise<boolean> {
    const user = await prisma.erpUser.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });
    return user?.isActive ?? false;
  }
}
