import express, { type Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import type { AppConfig } from './config.js';
import type { DbPool } from './db/pool.js';
import { createAuthMiddleware } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { meRouter } from './routes/me.js';
import { settingsRouter } from './routes/settings.js';
import { projectsRouter } from './routes/projects.js';
import { experimentsRouter } from './routes/experiments.js';
import { hypothesesRouter } from './routes/hypotheses.js';
import { resultsRouter } from './routes/results.js';
import { notesRouter } from './routes/notes.js';

export type CreateAppOptions = {
  pool: DbPool;
  config: AppConfig;
};

export function createApp(options: CreateAppOptions): Express {
  const { pool, config } = options;
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    cors({
      origin: config.allowedOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(createAuthMiddleware(pool, config));

  const api = express.Router();
  api.use(healthRouter(pool));
  api.use('/auth', authRouter(pool, config));
  api.use('/me', meRouter(pool));
  api.use('/settings', settingsRouter(pool));
  api.use('/projects', projectsRouter(pool));
  api.use('/experiments', experimentsRouter(pool));
  api.use('/hypotheses', hypothesesRouter(pool));
  api.use('/results', resultsRouter(pool));
  api.use('/notes', notesRouter(pool));

  app.use('/api', api);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
