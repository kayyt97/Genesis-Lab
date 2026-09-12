import { Router } from 'express';
import { z } from 'zod';
import type { DbPool } from '../db/pool.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { requireUser } from '../middleware/requireUser.js';
import { validateBody } from '../middleware/validate.js';

const putSchema = z.object({
  preferences: z.record(z.unknown()),
});

export function settingsRouter(pool: DbPool): Router {
  const router = Router();

  router.get('/', requireUser, async (req: AuthedRequest, res, next) => {
    try {
      const result = await pool.query<{ preferences: unknown; updated_at: Date }>(
        `SELECT preferences, updated_at FROM user_settings WHERE user_id = $1`,
        [req.user!.id],
      );
      const row = result.rows[0];
      res.json({
        preferences: row?.preferences ?? {},
        updatedAt: row?.updated_at?.toISOString() ?? null,
      });
    } catch (err) {
      next(err);
    }
  });

  router.put('/', requireUser, validateBody(putSchema), async (req: AuthedRequest, res, next) => {
    try {
      const body = req.body as z.infer<typeof putSchema>;
      const result = await pool.query<{ preferences: unknown; updated_at: Date }>(
        `INSERT INTO user_settings (user_id, preferences)
         VALUES ($1, $2::jsonb)
         ON CONFLICT (user_id) DO UPDATE
           SET preferences = EXCLUDED.preferences, updated_at = now()
         RETURNING preferences, updated_at`,
        [req.user!.id, JSON.stringify(body.preferences)],
      );
      res.json({
        preferences: result.rows[0].preferences,
        updatedAt: result.rows[0].updated_at.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
