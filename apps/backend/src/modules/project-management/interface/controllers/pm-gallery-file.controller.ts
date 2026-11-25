import { Request, Response } from 'express';
import { PmGalleryFileService } from '../../application/services/pm-gallery-file.service.js';
import { UploadPmGalleryFileSchema } from '../../application/dtos/pm-gallery-file.dto.js';

export class PmGalleryFileController {
  constructor(private readonly service: PmGalleryFileService) {}

  uploadFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const entityType = req.params.entityType as string;
      const entityId = req.params.entityId as string;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'No file provided' });
        return;
      }

      const parsedData = UploadPmGalleryFileSchema.parse(req.body);
      const result = await this.service.uploadFile(entityType, entityId, file, parsedData);
      
      const response = {
        ...result,
        size: Number(result.size)
      };

      res.status(201).json(response);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getFiles = async (req: Request, res: Response): Promise<void> => {
    try {
      const entityType = req.params.entityType as string;
      const entityId = req.params.entityId as string;
      const files = await this.service.getFiles(entityType, entityId);
      
      const response = files.map(file => ({
        ...file,
        size: Number(file.size)
      }));

      res.status(200).json(response);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  deleteFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      await this.service.deleteFile(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
