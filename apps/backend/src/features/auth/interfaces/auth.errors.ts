export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_DISABLED = 'USER_DISABLED',
  USER_NOT_VERIFIED = 'USER_NOT_VERIFIED',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  ROLE_NOT_FOUND = 'ROLE_NOT_FOUND',
  ROLE_NOT_ASSIGNED = 'ROLE_NOT_ASSIGNED',
  COMPANY_PENDING = 'COMPANY_PENDING',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
