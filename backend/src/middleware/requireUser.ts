import type { NextFunction, Request, Response } from 'express';
import { requireUser as requireUserMw, type AuthedRequest } from './auth.js';

/** Re-export for the approved file layout (`middleware/requireUser.ts`). */
export function requireUser(req: Request, res: Response, next: NextFunction): void {
  requireUserMw(req as AuthedRequest, res, next);
}

export type { AuthedRequest };
