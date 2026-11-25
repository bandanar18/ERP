export interface UploadedFile {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  uploadDate: string;
  entityType: string;
  entityId: string;
  description?: string;
  category?: string;
}

export interface FileListResponse {
  files: UploadedFile[];
  total: number;
  entityType: string;
  entityId: string;
}

export interface FileStats {
  totalFiles: number;
  totalSize: number;
  totalSizeMB: number;
}

export type FileCategory = 'documentos' | 'imagenes' | 'planos' | 'contratos' | 'otros';

export interface UploadFileRequest {
  file: File;
  description?: string;
  category?: string;
}
