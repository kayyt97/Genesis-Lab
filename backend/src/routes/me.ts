import { Router } from 'express';
import { z } from 'zod';
import type { DbPool } from '../db/pool.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { requireUser } from '../middleware/requireUser.js';
import { validateBody } from '../middleware/validate.js';
import { updateProfile } from '../services/authService.js';

const patchSchema = z.object({
  displayName: z.string().max(120),
});

export function meRouter(pool: DbPool): Router {
  const router = Router();

  router.get('/', requireUser, (req: AuthedRequest, res) => {
    res.json({ user: req.user });
  });

  router.patch('/', requireUser, validateBody(patchSchema), async (req: AuthedRequest, res, next) => {
    try {
      const body = req.body as z.infer<typeof patchSchema>;
      const user = await updateProfile(pool, req.user!.id, body.displayName);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
