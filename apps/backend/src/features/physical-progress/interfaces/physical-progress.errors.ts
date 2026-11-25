export enum PhysicalProgressErrorCode {
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NO_PROJECTS_FOUND = 'NO_PROJECTS_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export class PhysicalProgressError extends Error {
  constructor(
    public readonly code: PhysicalProgressErrorCode,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'PhysicalProgressError';
  }

  static projectNotFoundOrUnauthorized() {
    return new PhysicalProgressError(
      PhysicalProgressErrorCode.UNAUTHORIZED,
      'Proyecto no encontrado o no tienes permiso para acceder',
      403
    );
  }

  static noProjectsFound() {
    return new PhysicalProgressError(
      PhysicalProgressErrorCode.NO_PROJECTS_FOUND,
      'No se encontraron proyectos para esta empresa',
      404
    );
  }
}
