import { Router } from 'express';
import { z } from 'zod';
import type { DbPool } from '../db/pool.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { requireUser } from '../middleware/requireUser.js';
import { validateBody } from '../middleware/validate.js';
import { assertOwnedForeignKey, requireOwnedRow } from '../services/ownership.js';

const createSchema = z.object({
  experimentId: z.string().uuid().nullable().optional(),
  simulationId: z.string().max(200).nullable().optional(),
  summary: z.string().max(20000).optional().default(''),
  finalState: z.unknown().optional().default({}),
  timeline: z.unknown().optional().default([]),
  events: z.unknown().optional().default([]),
  controlComparison: z.unknown().nullable().optional(),
  metadata: z.unknown().optional().default({}),
});

const updateSchema = createSchema.partial();

type ResultRow = {
  id: string;
  user_id: string;
  experiment_id: string | null;
  simulation_id: string | null;
  summary: string;
  final_state: unknown;
  timeline: unknown;
  events: unknown;
  control_comparison: unknown;
  metadata: unknown;
  created_at: Date;
  updated_at: Date;
};

function mapResult(row: ResultRow) {
  return {
    id: row.id,
    experimentId: row.experiment_id,
    simulationId: row.simulation_id,
    summary: row.summary,
    finalState: row.final_state,
    timeline: row.timeline,
    events: row.events,
    controlComparison: row.control_comparison,
    metadata: row.metadata,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export function resultsRouter(pool: DbPool): Router {
  const router = Router();

  router.get('/', requireUser, async (req: AuthedRequest, res, next) => {
    try {
      const experimentId =
        typeof req.query.experimentId === 'string' ? req.query.experimentId : null;
      const result = experimentId
        ? await pool.query<ResultRow>(
            `SELECT * FROM results WHERE user_id = $1 AND experiment_id = $2 ORDER BY created_at DESC`,
            [req.user!.id, experimentId],
          )
        : await pool.query<ResultRow>(
            `SELECT * FROM results WHERE user_id = $1 ORDER BY created_at DESC`,
            [req.user!.id],
          );
      res.json({ results: result.rows.map(mapResult) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/', requireUser, validateBody(createSchema), async (req: AuthedRequest, res, next) => {
    try {
      const body = req.body as z.infer<typeof createSchema>;
      await assertOwnedForeignKey(pool, 'experiments', body.experimentId, req.user!.id);
      const result = await pool.query<ResultRow>(
        `INSERT INTO results (
           user_id, experiment_id, simulation_id, summary, final_state, timeline, events,
           control_comparison, metadata
         ) VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb)
         RETURNING *`,
        [
          req.user!.id,
          body.experimentId ?? null,
          body.simulationId ?? null,
          body.summary,
          JSON.stringify(body.finalState ?? {}),
          JSON.stringify(body.timeline ?? []),
          JSON.stringify(body.events ?? []),
          body.controlComparison === undefined || body.controlComparison === null
            ? null
            : JSON.stringify(body.controlComparison),
          JSON.stringify(body.metadata ?? {}),
        ],
      );
      res.status(201).json({ result: mapResult(result.rows[0]) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', requireUser, async (req: AuthedRequest, res, next) => {
    try {
      const row = await requireOwnedRow<ResultRow>(pool, 'results', req.params.id, req.user!.id);
      res.json({ result: mapResult(row) });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id', requireUser, validateBody(updateSchema), async (req: AuthedRequest, res, next) => {
    try {
      const current = await requireOwnedRow<ResultRow>(pool, 'results', req.params.id, req.user!.id);
      const body = req.body as z.infer<typeof updateSchema>;
      if (body.experimentId !== undefined) {
        await assertOwnedForeignKey(pool, 'experiments', body.experimentId, req.user!.id);
      }

      const result = await pool.query<ResultRow>(
        `UPDATE results SET
           experiment_id = $1,
           simulation_id = $2,
           summary = $3,
           final_state = $4::jsonb,
           timeline = $5::jsonb,
           events = $6::jsonb,
           control_comparison = $7::jsonb,
           metadata = $8::jsonb,
           updated_at = now()
         WHERE id = $9 AND user_id = $10
         RETURNING *`,
        [
          body.experimentId !== undefined ? body.experimentId : current.experiment_id,
          body.simulationId !== undefined ? body.simulationId : current.simulation_id,
          body.summary ?? current.summary,
          JSON.stringify(body.finalState !== undefined ? body.finalState : current.final_state),
          JSON.stringify(body.timeline !== undefined ? body.timeline : current.timeline),
          JSON.stringify(body.events !== undefined ? body.events : current.events),
          body.controlComparison !== undefined
            ? body.controlComparison === null
              ? null
              : JSON.stringify(body.controlComparison)
            : current.control_comparison === null
              ? null
              : JSON.stringify(current.control_comparison),
          JSON.stringify(body.metadata !== undefined ? body.metadata : current.metadata),
          req.params.id,
          req.user!.id,
        ],
      );
      res.json({ result: mapResult(result.rows[0]) });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', requireUser, async (req: AuthedRequest, res, next) => {
    try {
      await requireOwnedRow(pool, 'results', req.params.id, req.user!.id);
      await pool.query(`DELETE FROM results WHERE id = $1 AND user_id = $2`, [
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
