import fs from 'fs';
import path from 'path';

export class StorageService {
  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.resolve(filePath);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (error) {
      console.error(`Error deleting file at ${filePath}:`, error);
      throw new Error('No se pudo eliminar el archivo físico');
    }
  }

  async getFileStream(filePath: string): Promise<fs.ReadStream> {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error('Archivo no encontrado');
    }
    return fs.createReadStream(fullPath);
  }
}
