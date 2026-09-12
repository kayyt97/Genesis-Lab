import { Router } from 'express';
import { z } from 'zod';
import type { DbPool } from '../db/pool.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { requireUser } from '../middleware/requireUser.js';
import { validateBody } from '../middleware/validate.js';
import { assertOwnedForeignKey, requireOwnedRow } from '../services/ownership.js';

const createSchema = z.object({
  experimentId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(500),
  bodyNotes: z.string().max(50000).optional().default(''),
  observations: z.string().max(50000).optional().default(''),
  hypothesisText: z.string().max(20000).optional().default(''),
  conclusions: z.string().max(20000).optional().default(''),
  tags: z.array(z.string().max(100)).max(50).optional().default([]),
  entryAt: z.string().datetime().optional(),
});

const updateSchema = createSchema.partial();

type NoteRow = {
  id: string;
  user_id: string;
  experiment_id: string | null;
  project_id: string | null;
  title: string;
  body_notes: string;
  observations: string;
  hypothesis_text: string;
  conclusions: string;
  tags: unknown;
  entry_at: Date;
  created_at: Date;
  updated_at: Date;
};

function mapNote(row: NoteRow) {
  return {
    id: row.id,
    experimentId: row.experiment_id,
    projectId: row.project_id,
    title: row.title,
    bodyNotes: row.body_notes,
    observations: row.observations,
    hypothesisText: row.hypothesis_text,
    conclusions: row.conclusions,
    tags: row.tags,
    entryAt: row.entry_at.toISOString(),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export function notesRouter(pool: DbPool): Router {
  const router = Router();

  router.get('/', requireUser, async (req: AuthedRequest, res, next) => {
    try {
      const experimentId =
        typeof req.query.experimentId === 'string' ? req.query.experimentId : null;
      const result = experimentId
        ? await pool.query<NoteRow>(
            `SELECT * FROM research_notes WHERE user_id = $1 AND experiment_id = $2 ORDER BY updated_at DESC`,
            [req.user!.id, experimentId],
          )
        : await pool.query<NoteRow>(
            `SELECT * FROM research_notes WHERE user_id = $1 ORDER BY updated_at DESC`,
            [req.user!.id],
          );
      res.json({ notes: result.rows.map(mapNote) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/', requireUser, validateBody(createSchema), async (req: AuthedRequest, res, next) => {
    try {
      const body = req.body as z.infer<typeof createSchema>;
      await assertOwnedForeignKey(pool, 'experiments', body.experimentId, req.user!.id);
      await assertOwnedForeignKey(pool, 'projects', body.projectId, req.user!.id);
      const result = await pool.query<NoteRow>(
        `INSERT INTO research_notes (
           user_id, experiment_id, project_id, title, body_notes, observations,
           hypothesis_text, conclusions, tags, entry_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb, COALESCE($10::timestamptz, now()))
         RETURNING *`,
        [
          req.user!.id,
          body.experimentId ?? null,
          body.projectId ?? null,
          body.title,
          body.bodyNotes,
          body.observations,
          body.hypothesisText,
          body.conclusions,
          JSON.stringify(body.tags ?? []),
          body.entryAt ?? null,
        ],
      );
      res.status(201).json({ note: mapNote(result.rows[0]) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', requireUser, async (req: AuthedRequest, res, next) => {
    try {
      const row = await requireOwnedRow<NoteRow>(
        pool,
        'research_notes',
        req.params.id,
        req.user!.id,
      );
      res.json({ note: mapNote(row) });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id', requireUser, validateBody(updateSchema), async (req: AuthedRequest, res, next) => {
    try {
      const current = await requireOwnedRow<NoteRow>(
        pool,
        'research_notes',
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

      const result = await pool.query<NoteRow>(
        `UPDATE research_notes SET
           experiment_id = $1,
           project_id = $2,
           title = $3,
           body_notes = $4,
           observations = $5,
           hypothesis_text = $6,
           conclusions = $7,
           tags = $8::jsonb,
           entry_at = $9,
           updated_at = now()
         WHERE id = $10 AND user_id = $11
         RETURNING *`,
        [
          body.experimentId !== undefined ? body.experimentId : current.experiment_id,
          body.projectId !== undefined ? body.projectId : current.project_id,
          body.title ?? current.title,
          body.bodyNotes ?? current.body_notes,
          body.observations ?? current.observations,
          body.hypothesisText ?? current.hypothesis_text,
          body.conclusions ?? current.conclusions,
          JSON.stringify(body.tags !== undefined ? body.tags : current.tags),
          body.entryAt ? new Date(body.entryAt) : current.entry_at,
          req.params.id,
          req.user!.id,
        ],
      );
      res.json({ note: mapNote(result.rows[0]) });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', requireUser, async (req: AuthedRequest, res, next) => {
    try {
      await requireOwnedRow(pool, 'research_notes', req.params.id, req.user!.id);
      await pool.query(`DELETE FROM research_notes WHERE id = $1 AND user_id = $2`, [
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
