import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import type { Request } from 'express';
import { UPLOADS_DIR } from '../../../../config/paths.js';

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const { entityType, entityId } = req.params;
    const uploadPath = path.join(UPLOADS_DIR, String(entityType), String(entityId));
    
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${randomUUID()}-${sanitizedName}${ext}`);
  }
});

const fileFilter = (_req: Request, _file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  cb(null, true);
};

export const uploadConfig = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10
  }
});

export const uploadSingle = (req: any, res: any, next: any) => {
  uploadConfig.single('file')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'El archivo excede el tamaño máximo de 50MB' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Máximo 10 archivos permitidos' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: 'Campo de archivo inesperado' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

export const uploadMultiple = uploadConfig.array('files', 10);
