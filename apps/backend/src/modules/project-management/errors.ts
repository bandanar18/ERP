export class PmError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class PmNotFoundError extends PmError {
  constructor(message: string = 'Not found') {
    super(message, 404);
  }
}

export class PmValidationError extends PmError {
  constructor(message: string = 'Validation error') {
    super(message, 400);
  }
}

export class PmUnauthorizedError extends PmError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class PmForbiddenError extends PmError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}
