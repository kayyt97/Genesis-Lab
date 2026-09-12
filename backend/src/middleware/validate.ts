import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { badRequest } from '../errors.js';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues.map((i) => i.message).join('; ') || 'Invalid request body';
        next(badRequest('VALIDATION_ERROR', message));
        return;
      }
      next(err);
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.query);
      (req as Request & { validatedQuery: T }).validatedQuery = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues.map((i) => i.message).join('; ') || 'Invalid query parameters';
        next(badRequest('VALIDATION_ERROR', message));
        return;
      }
      next(err);
    }
  };
}
