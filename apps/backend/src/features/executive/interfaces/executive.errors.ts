import type { Response } from 'express';
import type { ZodType } from 'zod';

/**
 * MÓDULO EJECUTIVO — Errores tipados.
 * Mismo patrón que PhysicalProgressError: código + mensaje + statusCode.
 */
export enum ExecutiveErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class ExecutiveError extends Error {
  constructor(
    public readonly code: ExecutiveErrorCode,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ExecutiveError';
  }

  static badRequest(message: string) {
    return new ExecutiveError(ExecutiveErrorCode.BAD_REQUEST, message, 400);
  }

  static validationFailed(details: unknown) {
    return new ExecutiveError(
      ExecutiveErrorCode.VALIDATION_ERROR,
      'Validation failed',
      400,
      details,
    );
  }

  static notFound(message: string) {
    return new ExecutiveError(ExecutiveErrorCode.NOT_FOUND, message, 404);
  }

  static forbidden(message: string) {
    return new ExecutiveError(ExecutiveErrorCode.FORBIDDEN, message, 403);
  }

  static unauthorized(message: string) {
    return new ExecutiveError(ExecutiveErrorCode.UNAUTHORIZED, message, 401);
  }

  static conflict(message: string) {
    return new ExecutiveError(ExecutiveErrorCode.CONFLICT, message, 409);
  }
}

/** Valida `data` contra un schema zod; lanza ExecutiveError 400 con los issues. */
export function validate<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw ExecutiveError.validationFailed(result.error.issues);
  }
  return result.data;
}

/**
 * Normaliza cualquier error a una respuesta HTTP con el contrato de error
 * del ERP: { error, code?, details? }.
 */
export function sendError(res: Response, error: unknown, fallbackMessage = 'Error interno del servidor'): void {
  if (error instanceof ExecutiveError) {
    res.status(error.statusCode).json({
      error: error.message,
      ...(error.code ? { code: error.code } : {}),
      ...(error.details !== undefined ? { details: error.details } : {}),
    });
    return;
  }

  console.error('[Executive] Error no tipado:', error instanceof Error ? error.stack : error);
  res.status(500).json({ error: fallbackMessage, code: ExecutiveErrorCode.INTERNAL_ERROR });
}

