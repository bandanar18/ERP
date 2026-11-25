import { PmGalleryFile } from '../entities/pm-gallery-file.entity';

export interface IPmGalleryFileRepository {
  create(file: Omit<PmGalleryFile, 'id' | 'uploadDate'>): Promise<PmGalleryFile>;
  findByEntity(entityType: string, entityId: string): Promise<PmGalleryFile[]>;
  findById(id: string): Promise<PmGalleryFile | null>;
  delete(id: string): Promise<void>;
}
