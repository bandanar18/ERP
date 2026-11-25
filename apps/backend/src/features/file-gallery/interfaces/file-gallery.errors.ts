export class FileGalleryError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'FILE_GALLERY_ERROR'
  ) {
    super(message);
    this.name = 'FileGalleryError';
  }
}

export class FileNotFoundError extends FileGalleryError {
  constructor() {
    super('Archivo no encontrado', 404, 'FILE_NOT_FOUND');
  }
}

export class FileSizeExceededError extends FileGalleryError {
  constructor(maxSize: number) {
    super(
      `El archivo excede el tamaño máximo permitido de ${maxSize}MB`,
      400,
      'FILE_SIZE_EXCEEDED'
    );
  }
}

export class InvalidFileTypeError extends FileGalleryError {
  constructor(mimeType: string) {
    super(
      `Tipo de archivo no permitido: ${mimeType}`,
      400,
      'INVALID_FILE_TYPE'
    );
  }
}

export class UnauthorizedEntityAccessError extends FileGalleryError {
  constructor() {
    super(
      'No tienes permiso para acceder a archivos de esta entidad',
      403,
      'UNAUTHORIZED_ENTITY_ACCESS'
    );
  }
}
