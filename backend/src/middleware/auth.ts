import type { NextFunction, Request, Response } from 'express';
import type { AppConfig } from '../config.js';
import type { DbPool } from '../db/pool.js';
import { unauthorized } from '../errors.js';
import { resolveSession } from '../services/authService.js';
import type { PublicUser } from '../types/api.js';

export type AuthedRequest = Request & {
  user?: PublicUser;
  sessionId?: string;
};

export function createAuthMiddleware(pool: DbPool, config: AppConfig) {
  return async (req: AuthedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies?.[config.sessionCookieName] as string | undefined;
      if (!token) {
        next();
        return;
      }

      const resolved = await resolveSession(pool, config, token);
      if (resolved) {
        req.user = resolved.user;
        req.sessionId = resolved.sessionId;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireUser(req: AuthedRequest, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(unauthorized());
    return;
  }
  if (req.user.status !== 'active') {
    next(unauthorized('Account is disabled'));
    return;
  }
  next();
}
