import { prisma } from '@/config/database';
import { Prisma } from '@prisma/client';
import { UserWithRelations, GetUsersQuery } from '../interfaces/user.types';

export class UserRepository {
  async findAll(query: GetUsersQuery = {}): Promise<UserWithRelations[]> {
    const where: Prisma.ErpUserWhereInput = {};

    // Filtrar por rol
    if (query.role) {
      where.role = {
        name: query.role,
      };
    }

    // Filtrar por empresa
    if (query.companyId) {
      where.companyId = query.companyId;
    }

    // Filtrar por estado activo
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    return prisma.erpUser.findMany({
      where,
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }) as Promise<UserWithRelations[]>;
  }

  async findById(id: string): Promise<UserWithRelations | null> {
    return prisma.erpUser.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }) as Promise<UserWithRelations | null>;
  }

  async findByEmail(email: string): Promise<UserWithRelations | null> {
    return prisma.erpUser.findUnique({
      where: { email },
      include: {
        role: true,
        company: true,
      },
    }) as Promise<UserWithRelations | null>;
  }

  async findByRole(roleName: string): Promise<UserWithRelations[]> {
    return prisma.erpUser.findMany({
      where: {
        role: {
          name: roleName,
        },
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }) as Promise<UserWithRelations[]>;
  }

  async update(id: string, data: Partial<UserWithRelations>): Promise<UserWithRelations> {
    // Extraer roleId del data para manejarlo correctamente
    const { role, company, _count, ...updateData } = data as any;

    return prisma.erpUser.update({
      where: { id },
      data: {
        ...updateData,
        ...(role?.id && { roleId: role.id }),
        ...(company?.id !== undefined && { companyId: company.id === null ? null : company.id }),
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }) as Promise<UserWithRelations>;
  }

  async delete(id: string): Promise<void> {
    await prisma.erpUser.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.erpUser.count({ where: { id } });
    return count > 0;
  }
}
