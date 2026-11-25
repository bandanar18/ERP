import { PmGalleryFile } from '../../../domain/entities/pm-gallery-file.entity.js';
import { PrismaClient } from '@prisma/client';
import { IPmGalleryFileRepository } from '../../../domain/repositories/pm-gallery-file.repository.interface.js';

export class PmGalleryFilePrismaRepository implements IPmGalleryFileRepository {
  constructor(private prisma: PrismaClient) {}

  async create(file: Omit<PmGalleryFile, 'id' | 'uploadDate'>): Promise<PmGalleryFile> {
    const created = await this.prisma.pmGalleryFile.create({
      data: {
        fileName: file.fileName,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        path: file.path,
        module: file.module,
        entityType: file.entityType,
        entityId: file.entityId,
        description: file.description,
        category: file.category,
      },
    });

    return created as unknown as PmGalleryFile;
  }

  async findByEntity(entityType: string, entityId: string): Promise<PmGalleryFile[]> {
    const files = await this.prisma.pmGalleryFile.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        uploadDate: 'desc',
      },
    });
    return files as unknown as PmGalleryFile[];
  }

  async findById(id: string): Promise<PmGalleryFile | null> {
    const file = await this.prisma.pmGalleryFile.findUnique({
      where: { id },
    });
    return file as unknown as PmGalleryFile | null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.pmGalleryFile.delete({
      where: { id },
    });
  }
}
