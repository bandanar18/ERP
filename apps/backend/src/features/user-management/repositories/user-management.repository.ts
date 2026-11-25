import { prisma } from '../../../prisma/prisma';

export class UserManagementRepository {
  async findAll(search?: string, page: number = 1, limit: number = 12) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.erpUser.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          roleId: true,
          companyId: true,
          role: {
            select: {
              id: true,
              name: true
            }
          },
          company: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.erpUser.count({ where }),
    ]);

    return { data, total };
  }

  async updateRole(userId: string, roleId: string | null) {
    return prisma.erpUser.update({
      where: { id: userId },
      data: { roleId },
    });
  }

  async updateCompany(userId: string, companyId: string | null) {
    return prisma.erpUser.update({
      where: { id: userId },
      data: { companyId },
    });
  }

  async findAllRoles() {
    return prisma.erpRole.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async toggleActive(userId: string) {
    const user = await prisma.erpUser.findUnique({
      where: { id: userId },
      select: { isActive: true }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return prisma.erpUser.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
  }
}
