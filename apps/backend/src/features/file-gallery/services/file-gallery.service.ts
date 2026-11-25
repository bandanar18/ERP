import fs from 'fs/promises';
import { FileGalleryRepository } from '../repositories';
import {
  FileGalleryError,
  FileNotFoundError
} from '../interfaces';

export class FileGalleryService {
  private readonly repository: FileGalleryRepository;

  constructor() {
    this.repository = new FileGalleryRepository();
  }

  async createFile(
    file: Express.Multer.File,
    entityType: string,
    entityId: string,
    metadata?: { description?: string; category?: string }
  ) {
    // Validar que el archivo existe físicamente
    try {
      await fs.access(file.path);
    } catch {
      throw new FileGalleryError('Archivo no guardado correctamente', 500);
    }

    // Corregir codificación del nombre del archivo (Multer lo lee como latin1 por defecto en los headers HTTP)
    const decodedOriginalName = Buffer.from(file.originalname, 'latin1').toString('utf8');

    // Crear registro en base de datos
    const savedFile = await this.repository.create({
      fileName: file.filename,
      originalName: decodedOriginalName,
      mimeType: file.mimetype,
      size: BigInt(file.size),
      path: file.path,
      entityType,
      entityId,
      description: metadata?.description,
      category: metadata?.category
    });

    return savedFile;
  }

  async getFilesByEntity(
    entityType: string,
    entityId: string,
    filters?: {
      category?: string;
      mimeType?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const files = await this.repository.findByEntity(entityType, entityId, filters);

    // Convertir BigInt a Number para JSON
    return files.map(file => ({
      ...file,
      size: Number(file.size)
    }));
  }

  async getFileById(id: string) {
    const file = await this.repository.findById(id);

    if (!file) {
      throw new FileNotFoundError();
    }

    return {
      ...file,
      size: Number(file.size)
    };
  }

  async deleteFile(id: string) {
    const file = await this.repository.findById(id);

    if (!file) {
      throw new FileNotFoundError();
    }

    // Eliminar archivo físico
    try {
      await fs.unlink(file.path);
    } catch (error) {
      console.error('Error al eliminar archivo físico:', error);
      // Continuar con la eliminación del registro aunque falle el archivo
    }

    // Eliminar registro de base de datos
    await this.repository.delete(id);

    return { message: 'Archivo eliminado correctamente' };
  }

  async getEntityStats(entityType: string, entityId: string) {
    const [count, totalSize] = await Promise.all([
      this.repository.countByEntity(entityType, entityId),
      this.repository.getTotalSizeByEntity(entityType, entityId)
    ]);

    return {
      totalFiles: count,
      totalSize: Number(totalSize),
      totalSizeMB: Number(totalSize) / (1024 * 1024)
    };
  }
}
