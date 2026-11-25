import { prisma } from '../../../config/database';
import type { FileFilterOptions } from '../interfaces';

export class FileGalleryRepository {
  async create(data: {
    fileName: string;
    originalName: string;
    mimeType: string;
    size: bigint;
    path: string;
    entityType: string;
    entityId: string;
    description?: string;
    category?: string;
  }) {
    return await prisma.pmGalleryFile.create({
      data
    });
  }

  async findByEntity(entityType: string, entityId: string, filters?: FileFilterOptions) {
    const where: any = {
      entityType,
      entityId
    };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.mimeType) {
      where.mimeType = { startsWith: filters.mimeType };
    }

    if (filters?.startDate || filters?.endDate) {
      where.uploadDate = {};
      if (filters.startDate) where.uploadDate.gte = filters.startDate;
      if (filters.endDate) where.uploadDate.lte = filters.endDate;
    }

    return await prisma.pmGalleryFile.findMany({
      where,
      orderBy: { uploadDate: 'desc' }
    });
  }

  async findById(id: string) {
    return await prisma.pmGalleryFile.findUnique({
      where: { id }
    });
  }

  async delete(id: string) {
    return await prisma.pmGalleryFile.delete({
      where: { id }
    });
  }

  async countByEntity(entityType: string, entityId: string) {
    return await prisma.pmGalleryFile.count({
      where: {
        entityType,
        entityId
      }
    });
  }

  async getTotalSizeByEntity(entityType: string, entityId: string) {
    const result = await prisma.pmGalleryFile.aggregate({
      where: {
        entityType,
        entityId
      },
      _sum: {
        size: true
      }
    });
    return result._sum.size || BigInt(0);
  }
}
