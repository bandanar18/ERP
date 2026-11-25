import { IPmGalleryFileRepository } from '../../../domain/repositories/pm-gallery-file.repository.interface.js';
import { PmGalleryFile } from '../../../domain/entities/pm-gallery-file.entity.js';
import { UploadPmGalleryFileDTO } from '../../dtos/pm-gallery-file.dto.js';

export class UploadPmGalleryFileUseCase {
  constructor(private readonly repository: IPmGalleryFileRepository) {}

  async execute(
    entityType: string,
    entityId: string,
    file: Express.Multer.File,
    data: UploadPmGalleryFileDTO
  ): Promise<PmGalleryFile> {
    const newFile = await this.repository.create({
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: BigInt(file.size),
      path: file.path,
      module: 'PROJECT_MANAGEMENT',
      entityType,
      entityId,
      description: data.description || null,
      category: data.category || null,
    });

    return newFile;
  }
}
