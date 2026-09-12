import { Router } from 'express';
import { z } from 'zod';
import type { AppConfig } from '../config.js';
import type { DbPool } from '../db/pool.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { requireUser } from '../middleware/requireUser.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validate.js';
import {
  loginUser,
  registerUser,
  revokeSession,
} from '../services/authService.js';

const registerSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(10).max(200),
  displayName: z.string().max(120).optional(),
});

const loginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(200),
});

function setSessionCookie(
  res: import('express').Response,
  config: AppConfig,
  rawToken: string,
  expiresAt: Date,
): void {
  res.cookie(config.sessionCookieName, rawToken, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

function clearSessionCookie(res: import('express').Response, config: AppConfig): void {
  res.clearCookie(config.sessionCookieName, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax',
    path: '/',
  });
}

export function authRouter(pool: DbPool, config: AppConfig): Router {
  const router = Router();
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    keyPrefix: 'auth',
  });

  router.get('/session', (req: AuthedRequest, res) => {
    if (!req.user) {
      res.json({ authenticated: false, user: null });
      return;
    }
    res.json({ authenticated: true, user: req.user });
  });

  router.post(
    '/register',
    authLimiter,
    validateBody(registerSchema),
    async (req, res, next) => {
      try {
        const body = req.body as z.infer<typeof registerSchema>;
        const result = await registerUser(pool, config, body, {
          userAgent: req.get('user-agent') ?? undefined,
          ip: req.ip,
        });
        setSessionCookie(res, config, result.rawToken, result.expiresAt);
        res.status(201).json({ user: result.user });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post('/login', authLimiter, validateBody(loginSchema), async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof loginSchema>;
      const result = await loginUser(pool, config, body, {
        userAgent: req.get('user-agent') ?? undefined,
        ip: req.ip,
      });
      setSessionCookie(res, config, result.rawToken, result.expiresAt);
      res.json({ user: result.user });
    } catch (err) {
      next(err);
    }
  });

  router.post('/logout', requireUser, async (req: AuthedRequest, res, next) => {
    try {
      if (req.sessionId) {
        await revokeSession(pool, req.sessionId);
      }
      clearSessionCookie(res, config);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
