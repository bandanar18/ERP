import { IPmGalleryFileRepository } from '../../../domain/repositories/pm-gallery-file.repository.interface.js';
import { PmGalleryFile } from '../../../domain/entities/pm-gallery-file.entity.js';

export class GetPmGalleryFilesUseCase {
  constructor(private readonly repository: IPmGalleryFileRepository) {}

  async execute(entityType: string, entityId: string): Promise<PmGalleryFile[]> {
    return this.repository.findByEntity(entityType, entityId);
  }
}
