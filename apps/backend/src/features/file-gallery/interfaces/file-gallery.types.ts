export enum EntityType {
  PROJECT = 'Project',
  COMPANY = 'Company',
  USER = 'User'
}

export interface UploadedFile {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadDate: Date;
  entityType: string;
  entityId: string;
  description?: string;
  category?: string;
}

export interface UploadResponse {
  file: UploadedFile;
  message: string;
}

export interface FileListResponse {
  files: UploadedFile[];
  total: number;
  entityType: string;
  entityId: string;
}

export interface FileFilterOptions {
  category?: string;
  mimeType?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface CreateFileGalleryRequest {
  description?: string;
  category?: string;
}

export interface EntityStats {
  totalFiles: number;
  totalSize: number;
  totalSizeMB: number;
}
