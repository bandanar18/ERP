export class QcError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class QcNotFoundError extends QcError {
  constructor(message: string = 'Not found') {
    super(message, 404);
  }
}

export class QcValidationError extends QcError {
  constructor(message: string = 'Validation error') {
    super(message, 400);
  }
}

export class QcConflictError extends QcError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

export class QcUnauthorizedError extends QcError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class QcForbiddenError extends QcError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}
