import { Router } from 'express';
import type { DbPool } from '../db/pool.js';
import { checkDatabase } from '../db/pool.js';

export function healthRouter(pool: DbPool): Router {
  const router = Router();

  router.get('/health', async (_req, res, next) => {
    try {
      let database: 'up' | 'down' = 'down';
      try {
        const ok = await checkDatabase(pool);
        database = ok ? 'up' : 'down';
      } catch {
        database = 'down';
      }

      const status = database === 'up' ? 'ok' : 'degraded';
      res.status(database === 'up' ? 200 : 503).json({
        status,
        service: 'genesis-backend',
        database,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
