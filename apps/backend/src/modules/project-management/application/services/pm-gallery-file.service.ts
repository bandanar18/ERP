import { UploadPmGalleryFileUseCase } from '../use-cases/pm-gallery-files/upload-file.use-case';
import { GetPmGalleryFilesUseCase } from '../use-cases/pm-gallery-files/get-files.use-case';
import { PmGalleryFile } from '../../domain/entities/pm-gallery-file.entity';
import { UploadPmGalleryFileDTO } from '../dtos/pm-gallery-file.dto';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { IPmGalleryFileRepository } from '../../domain/repositories/pm-gallery-file.repository.interface';

export class PmGalleryFileService {
  constructor(
    private readonly uploadUseCase: UploadPmGalleryFileUseCase,
    private readonly getFilesUseCase: GetPmGalleryFilesUseCase,
    private readonly repository: IPmGalleryFileRepository,
    private readonly storageService: StorageService
  ) {}

  async uploadFile(
    entityType: string,
    entityId: string,
    file: Express.Multer.File,
    data: UploadPmGalleryFileDTO
  ): Promise<PmGalleryFile> {
    return this.uploadUseCase.execute(entityType, entityId, file, data);
  }

  async getFiles(entityType: string, entityId: string): Promise<PmGalleryFile[]> {
    return this.getFilesUseCase.execute(entityType, entityId);
  }

  async deleteFile(id: string): Promise<void> {
    const file = await this.repository.findById(id);
    if (!file) throw new Error('File not found');

    await this.storageService.deleteFile(file.path);
    await this.repository.delete(id);
  }
}
