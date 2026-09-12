import { Router } from 'express';
import { z } from 'zod';
import type { DbPool } from '../db/pool.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { requireUser } from '../middleware/requireUser.js';
import { validateBody } from '../middleware/validate.js';
import { requireOwnedRow } from '../services/ownership.js';

const createSchema = z.object({
  title: z.string().min(1).max(500),
  researchQuestion: z.string().max(5000).optional().default(''),
  notes: z.string().max(20000).optional().default(''),
  includeGenomicData: z.boolean().optional().default(false),
});

const updateSchema = createSchema.partial();

type ProjectRow = {
  id: string;
  user_id: string;
  title: string;
  research_question: string;
  notes: string;
  include_genomic_data: boolean;
  created_at: Date;
  updated_at: Date;
};

function mapProject(row: ProjectRow) {
  return {
    id: row.id,
    title: row.title,
    researchQuestion: row.research_question,
    notes: row.notes,
    includeGenomicData: row.include_genomic_data,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export function projectsRouter(pool: DbPool): Router {
  const router = Router();

  router.get('/', requireUser, async (req: AuthedRequest, res, next) => {
    try {
      const result = await pool.query<ProjectRow>(
        `SELECT * FROM projects WHERE user_id = $1 ORDER BY updated_at DESC`,
        [req.user!.id],
      );
      res.json({ projects: result.rows.map(mapProject) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/', requireUser, validateBody(createSchema), async (req: AuthedRequest, res, next) => {
    try {
      const body = req.body as z.infer<typeof createSchema>;
      const result = await pool.query<ProjectRow>(
        `INSERT INTO projects (user_id, title, research_question, notes, include_genomic_data)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [req.user!.id, body.title, body.researchQuestion, body.notes, body.includeGenomicData],
      );
      res.status(201).json({ project: mapProject(result.rows[0]) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', requireUser, async (req: AuthedRequest, res, next) => {
    try {
      const row = await requireOwnedRow<ProjectRow>(pool, 'projects', req.params.id, req.user!.id);
      res.json({ project: mapProject(row) });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id', requireUser, validateBody(updateSchema), async (req: AuthedRequest, res, next) => {
    try {
      await requireOwnedRow(pool, 'projects', req.params.id, req.user!.id);
      const body = req.body as z.infer<typeof updateSchema>;
      const result = await pool.query<ProjectRow>(
        `UPDATE projects SET
           title = COALESCE($1, title),
           research_question = COALESCE($2, research_question),
           notes = COALESCE($3, notes),
           include_genomic_data = COALESCE($4, include_genomic_data),
           updated_at = now()
         WHERE id = $5 AND user_id = $6
         RETURNING *`,
        [
          body.title ?? null,
          body.researchQuestion ?? null,
          body.notes ?? null,
          body.includeGenomicData ?? null,
          req.params.id,
          req.user!.id,
        ],
      );
      res.json({ project: mapProject(result.rows[0]) });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', requireUser, async (req: AuthedRequest, res, next) => {
    try {
      await requireOwnedRow(pool, 'projects', req.params.id, req.user!.id);
      await pool.query(`DELETE FROM projects WHERE id = $1 AND user_id = $2`, [
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
