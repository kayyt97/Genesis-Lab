import { Router } from 'express';
import { z } from 'zod';
import type { DbPool } from '../db/pool.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { requireUser } from '../middleware/requireUser.js';
import { validateBody } from '../middleware/validate.js';
import { assertOwnedForeignKey, requireOwnedRow } from '../services/ownership.js';

const verdictEnum = z.enum(['supports', 'does-not-support', 'inconclusive']);

const createSchema = z.object({
  experimentId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  statement: z.string().max(10000).optional().default(''),
  workflow: z.unknown().optional().default({}),
  verdict: verdictEnum.nullable().optional(),
});

const updateSchema = createSchema.partial();

type HypothesisRow = {
  id: string;
  user_id: string;
  experiment_id: string | null;
  project_id: string | null;
  statement: string;
  workflow: unknown;
  verdict: string | null;
  created_at: Date;
  updated_at: Date;
};

function mapHypothesis(row: HypothesisRow) {
  return {
    id: row.id,
    experimentId: row.experiment_id,
    projectId: row.project_id,
    statement: row.statement,
    workflow: row.workflow,
    verdict: row.verdict,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export function hypothesesRouter(pool: DbPool): Router {
  const router = Router();

  router.get('/', requireUser, async (req: AuthedRequest, res, next) => {
    try {
      const experimentId =
        typeof req.query.experimentId === 'string' ? req.query.experimentId : null;
      const result = experimentId
        ? await pool.query<HypothesisRow>(
            `SELECT * FROM hypotheses WHERE user_id = $1 AND experiment_id = $2 ORDER BY updated_at DESC`,
            [req.user!.id, experimentId],
          )
        : await pool.query<HypothesisRow>(
            `SELECT * FROM hypotheses WHERE user_id = $1 ORDER BY updated_at DESC`,
            [req.user!.id],
          );
      res.json({ hypotheses: result.rows.map(mapHypothesis) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/', requireUser, validateBody(createSchema), async (req: AuthedRequest, res, next) => {
    try {
      const body = req.body as z.infer<typeof createSchema>;
      await assertOwnedForeignKey(pool, 'experiments', body.experimentId, req.user!.id);
      await assertOwnedForeignKey(pool, 'projects', body.projectId, req.user!.id);
      const result = await pool.query<HypothesisRow>(
        `INSERT INTO hypotheses (user_id, experiment_id, project_id, statement, workflow, verdict)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6)
         RETURNING *`,
        [
          req.user!.id,
          body.experimentId ?? null,
          body.projectId ?? null,
          body.statement,
          JSON.stringify(body.workflow ?? {}),
          body.verdict ?? null,
        ],
      );
      res.status(201).json({ hypothesis: mapHypothesis(result.rows[0]) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', requireUser, async (req: AuthedRequest, res, next) => {
    try {
      const row = await requireOwnedRow<HypothesisRow>(
        pool,
        'hypotheses',
        req.params.id,
        req.user!.id,
      );
      res.json({ hypothesis: mapHypothesis(row) });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id', requireUser, validateBody(updateSchema), async (req: AuthedRequest, res, next) => {
    try {
      const current = await requireOwnedRow<HypothesisRow>(
        pool,
        'hypotheses',
        req.params.id,
        req.user!.id,
      );
      const body = req.body as z.infer<typeof updateSchema>;
      if (body.experimentId !== undefined) {
        await assertOwnedForeignKey(pool, 'experiments', body.experimentId, req.user!.id);
      }
      if (body.projectId !== undefined) {
        await assertOwnedForeignKey(pool, 'projects', body.projectId, req.user!.id);
      }

      const result = await pool.query<HypothesisRow>(
        `UPDATE hypotheses SET
           experiment_id = $1,
           project_id = $2,
           statement = $3,
           workflow = $4::jsonb,
           verdict = $5,
           updated_at = now()
         WHERE id = $6 AND user_id = $7
         RETURNING *`,
        [
          body.experimentId !== undefined ? body.experimentId : current.experiment_id,
          body.projectId !== undefined ? body.projectId : current.project_id,
          body.statement ?? current.statement,
          JSON.stringify(body.workflow !== undefined ? body.workflow : current.workflow),
          body.verdict !== undefined ? body.verdict : current.verdict,
          req.params.id,
          req.user!.id,
        ],
      );
      res.json({ hypothesis: mapHypothesis(result.rows[0]) });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', requireUser, async (req: AuthedRequest, res, next) => {
    try {
      await requireOwnedRow(pool, 'hypotheses', req.params.id, req.user!.id);
      await pool.query(`DELETE FROM hypotheses WHERE id = $1 AND user_id = $2`, [
        req.params.id,
        req.user!.id,
      ]);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
