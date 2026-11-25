import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import type { Request } from 'express';
import { UPLOADS_DIR } from '../../../config/paths.js';

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const { entityType, entityId } = req.params;

    // Estructura: uploads/{entityType}/{entityId}/
    const uploadPath = path.join(UPLOADS_DIR, String(entityType), String(entityId));

    // Crear directorio si no existe
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    // Generar nombre único: uuid-originalname
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${randomUUID()}-${sanitizedName}${ext}`);
  }
});

// Filtro de tipos de archivo: acepta cualquier tipo
const fileFilter = (_req: Request, _file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  cb(null, true);
};

// Configuración de Multer
export const uploadConfig = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10 // Máximo 10 archivos por request
  }
});

// Middleware para subida individual con manejo de errores
export const uploadSingle = (req: any, res: any, next: any) => {
  uploadConfig.single('file')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      // Errores de Multer
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
      // Otros errores
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// Middleware para subida múltiple
export const uploadMultiple = uploadConfig.array('files', 10);
