import { PrismaClient } from '@prisma/client';
import { IErpUsersPort } from '../../domain/ports/erp-users.port.js';
import { PmErpUser, CreatePmErpUser, UpdatePmErpUser } from '../../domain/entities/erp-user.entity.js';

export class PrismaErpUsersAdapter implements IErpUsersPort {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<PmErpUser[]> {
    const users = await this.prisma.erpUser.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return users.map(this.mapToEntity);
  }

  async findById(id: string): Promise<PmErpUser | null> {
    const user = await this.prisma.erpUser.findUnique({ where: { id } });
    if (!user) return null;
    return this.mapToEntity(user);
  }

  async create(data: CreatePmErpUser): Promise<PmErpUser> {
    const password = data.password ?? '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjGQx40TNa'; // Default dummy hash
    const { password: _pw, ...rest } = data;
    const user = await this.prisma.erpUser.create({
      data: {
        ...rest,
        password
      }
    });
    return this.mapToEntity(user);
  }

  async update(id: string, data: UpdatePmErpUser): Promise<PmErpUser> {
    const { password: _pw, ...rest } = data;
    const updateData: any = { ...rest };
    if (_pw) {
      updateData.password = _pw;
    }
    const user = await this.prisma.erpUser.update({
      where: { id },
      data: updateData
    });
    return this.mapToEntity(user);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.erpUser.delete({ where: { id } });
  }

  private mapToEntity(prismaUser: any): PmErpUser {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      roleId: prismaUser.roleId,
      companyId: prismaUser.companyId,
      isActive: prismaUser.isActive,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt
    };
  }
}
