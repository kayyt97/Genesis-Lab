export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly expose: boolean;

  constructor(status: number, code: string, message: string, expose = true) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.expose = expose;
  }
}

export function notFound(message = 'Resource not found'): AppError {
  return new AppError(404, 'NOT_FOUND', message);
}

export function unauthorized(message = 'Authentication required'): AppError {
  return new AppError(401, 'UNAUTHORIZED', message);
}

export function forbidden(message = 'Forbidden'): AppError {
  return new AppError(403, 'FORBIDDEN', message);
}

export function conflict(code: string, message: string): AppError {
  return new AppError(409, code, message);
}

export function badRequest(code: string, message: string): AppError {
  return new AppError(400, code, message);
}

export function tooManyRequests(message = 'Too many requests'): AppError {
  return new AppError(429, 'RATE_LIMITED', message);
}
