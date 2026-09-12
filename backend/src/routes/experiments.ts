import { Router } from 'express';
import { z } from 'zod';
import type { DbPool } from '../db/pool.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { requireUser } from '../middleware/requireUser.js';
import { validateBody } from '../middleware/validate.js';
import { assertOwnedForeignKey, requireOwnedRow } from '../services/ownership.js';

const statusEnum = z.enum(['draft', 'active', 'completed', 'archived']);

const createSchema = z.object({
  projectId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(500),
  researchQuestion: z.string().max(5000).optional().default(''),
  status: statusEnum.optional().default('draft'),
  sampleId: z.string().max(200).nullable().optional(),
  organismId: z.string().max(200).nullable().optional(),
  controlGroup: z.string().max(2000).optional().default(''),
  experimentalGroup: z.string().max(2000).optional().default(''),
  durationHours: z.number().optional().default(0),
  environment: z.unknown().optional().default({}),
  independentVariables: z.unknown().optional().default([]),
  dependentVariables: z.unknown().optional().default([]),
  controlledVariables: z.unknown().optional().default([]),
  compoundIds: z.unknown().optional().default([]),
  conditions: z.unknown().optional().default([]),
  observations: z.unknown().optional().default([]),
  notes: z.string().max(20000).optional().default(''),
  simulationSeed: z.number().int().nullable().optional(),
  variabilityEnabled: z.boolean().optional().default(false),
  parentExperimentId: z.string().uuid().nullable().optional(),
  clientId: z.string().max(200).nullable().optional(),
});

const updateSchema = createSchema.partial();

type ExperimentRow = {
  id: string;
  user_id: string;
  project_id: string | null;
  name: string;
  research_question: string;
  status: string;
  sample_id: string | null;
  organism_id: string | null;
  control_group: string;
  experimental_group: string;
  duration_hours: number;
  environment: unknown;
  independent_variables: unknown;
  dependent_variables: unknown;
  controlled_variables: unknown;
  compound_ids: unknown;
  conditions: unknown;
  observations: unknown;
  notes: string;
  simulation_seed: number | null;
  variability_enabled: boolean;
  parent_experiment_id: string | null;
  client_id: string | null;
  created_at: Date;
  updated_at: Date;
};

function mapExperiment(row: ExperimentRow) {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    researchQuestion: row.research_question,
    status: row.status,
    sampleId: row.sample_id,
    organismId: row.organism_id,
    controlGroup: row.control_group,
    experimentalGroup: row.experimental_group,
    durationHours: row.duration_hours,
    environment: row.environment,
    independentVariables: row.independent_variables,
    dependentVariables: row.dependent_variables,
    controlledVariables: row.controlled_variables,
    compoundIds: row.compound_ids,
    conditions: row.conditions,
    observations: row.observations,
    notes: row.notes,
    simulationSeed: row.simulation_seed,
    variabilityEnabled: row.variability_enabled,
    parentExperimentId: row.parent_experiment_id,
    clientId: row.client_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function jsonParam(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export function experimentsRouter(pool: DbPool): Router {
  const router = Router();

  router.get('/', requireUser, async (req: AuthedRequest, res, next) => {
    try {
      const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : null;
      const result = projectId
        ? await pool.query<ExperimentRow>(
            `SELECT * FROM experiments WHERE user_id = $1 AND project_id = $2 ORDER BY updated_at DESC`,
            [req.user!.id, projectId],
          )
        : await pool.query<ExperimentRow>(
            `SELECT * FROM experiments WHERE user_id = $1 ORDER BY updated_at DESC`,
            [req.user!.id],
          );
      res.json({ experiments: result.rows.map(mapExperiment) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/', requireUser, validateBody(createSchema), async (req: AuthedRequest, res, next) => {
    try {
      const body = req.body as z.infer<typeof createSchema>;
      await assertOwnedForeignKey(pool, 'projects', body.projectId, req.user!.id);
      await assertOwnedForeignKey(pool, 'experiments', body.parentExperimentId, req.user!.id);

      const result = await pool.query<ExperimentRow>(
        `INSERT INTO experiments (
           user_id, project_id, name, research_question, status, sample_id, organism_id,
           control_group, experimental_group, duration_hours, environment,
           independent_variables, dependent_variables, controlled_variables, compound_ids,
           conditions, observations, notes, simulation_seed, variability_enabled,
           parent_experiment_id, client_id
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13::jsonb,$14::jsonb,
           $15::jsonb,$16::jsonb,$17::jsonb,$18,$19,$20,$21,$22
         ) RETURNING *`,
        [
          req.user!.id,
          body.projectId ?? null,
          body.name,
          body.researchQuestion,
          body.status,
          body.sampleId ?? null,
          body.organismId ?? null,
          body.controlGroup,
          body.experimentalGroup,
          body.durationHours,
          jsonParam(body.environment),
          jsonParam(body.independentVariables),
          jsonParam(body.dependentVariables),
          jsonParam(body.controlledVariables),
          jsonParam(body.compoundIds),
          jsonParam(body.conditions),
          jsonParam(body.observations),
          body.notes,
          body.simulationSeed ?? null,
          body.variabilityEnabled,
          body.parentExperimentId ?? null,
          body.clientId ?? null,
        ],
      );
      res.status(201).json({ experiment: mapExperiment(result.rows[0]) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', requireUser, async (req: AuthedRequest, res, next) => {
    try {
      const row = await requireOwnedRow<ExperimentRow>(
        pool,
        'experiments',
        req.params.id,
        req.user!.id,
      );
      res.json({ experiment: mapExperiment(row) });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id', requireUser, validateBody(updateSchema), async (req: AuthedRequest, res, next) => {
    try {
      await requireOwnedRow(pool, 'experiments', req.params.id, req.user!.id);
      const body = req.body as z.infer<typeof updateSchema>;
      if (body.projectId !== undefined) {
        await assertOwnedForeignKey(pool, 'projects', body.projectId, req.user!.id);
      }
      if (body.parentExperimentId !== undefined) {
        await assertOwnedForeignKey(pool, 'experiments', body.parentExperimentId, req.user!.id);
      }

      const current = await requireOwnedRow<ExperimentRow>(
        pool,
        'experiments',
        req.params.id,
        req.user!.id,
      );

      const result = await pool.query<ExperimentRow>(
        `UPDATE experiments SET
           project_id = $1,
           name = $2,
           research_question = $3,
           status = $4,
           sample_id = $5,
           organism_id = $6,
           control_group = $7,
           experimental_group = $8,
           duration_hours = $9,
           environment = $10::jsonb,
           independent_variables = $11::jsonb,
           dependent_variables = $12::jsonb,
           controlled_variables = $13::jsonb,
           compound_ids = $14::jsonb,
           conditions = $15::jsonb,
           observations = $16::jsonb,
           notes = $17,
           simulation_seed = $18,
           variability_enabled = $19,
           parent_experiment_id = $20,
           client_id = $21,
           updated_at = now()
         WHERE id = $22 AND user_id = $23
         RETURNING *`,
        [
          body.projectId !== undefined ? body.projectId : current.project_id,
          body.name ?? current.name,
          body.researchQuestion ?? current.research_question,
          body.status ?? current.status,
          body.sampleId !== undefined ? body.sampleId : current.sample_id,
          body.organismId !== undefined ? body.organismId : current.organism_id,
          body.controlGroup ?? current.control_group,
          body.experimentalGroup ?? current.experimental_group,
          body.durationHours ?? current.duration_hours,
          jsonParam(body.environment !== undefined ? body.environment : current.environment),
          jsonParam(
            body.independentVariables !== undefined
              ? body.independentVariables
              : current.independent_variables,
          ),
          jsonParam(
            body.dependentVariables !== undefined
              ? body.dependentVariables
              : current.dependent_variables,
          ),
          jsonParam(
            body.controlledVariables !== undefined
              ? body.controlledVariables
              : current.controlled_variables,
          ),
          jsonParam(body.compoundIds !== undefined ? body.compoundIds : current.compound_ids),
          jsonParam(body.conditions !== undefined ? body.conditions : current.conditions),
          jsonParam(body.observations !== undefined ? body.observations : current.observations),
          body.notes ?? current.notes,
          body.simulationSeed !== undefined ? body.simulationSeed : current.simulation_seed,
          body.variabilityEnabled ?? current.variability_enabled,
          body.parentExperimentId !== undefined
            ? body.parentExperimentId
            : current.parent_experiment_id,
          body.clientId !== undefined ? body.clientId : current.client_id,
          req.params.id,
          req.user!.id,
        ],
      );
      res.json({ experiment: mapExperiment(result.rows[0]) });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', requireUser, async (req: AuthedRequest, res, next) => {
    try {
      await requireOwnedRow(pool, 'experiments', req.params.id, req.user!.id);
      await pool.query(`DELETE FROM experiments WHERE id = $1 AND user_id = $2`, [
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
