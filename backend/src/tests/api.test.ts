import { describe, expect, test, beforeAll, afterAll, beforeEach } from 'bun:test';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../app.js';
import type { DbPool } from '../db/pool.js';
import { hashPassword, verifyPassword } from '../services/authService.js';
import { createTestPool, testConfig } from './helpers.js';
import { resetRateLimitBuckets } from '../middleware/rateLimit.js';

describe('password hashing', () => {
  test('hashes with Argon2id and verifies correctly', async () => {
    const hash = await hashPassword('correct-horse-battery');
    expect(hash).not.toContain('correct-horse-battery');
    expect(hash.startsWith('$argon2')).toBe(true);
    expect(await verifyPassword(hash, 'correct-horse-battery')).toBe(true);
    expect(await verifyPassword(hash, 'wrong-password')).toBe(false);
  });
});

describe('Genesis API Phase 1', () => {
  let pool: DbPool;
  let app: Express;
  const config = testConfig();

  beforeAll(async () => {
    pool = await createTestPool();
    app = createApp({ pool, config });
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(() => {
    resetRateLimitBuckets();
  });

  test('GET /api/health returns service health without secrets', async () => {
    const res = await request(app).get('/api/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body.service).toBe('genesis-backend');
    expect(res.body.status).toBeDefined();
    expect(JSON.stringify(res.body)).not.toContain('SESSION_SECRET');
    expect(JSON.stringify(res.body)).not.toContain('password');
    expect(JSON.stringify(res.body)).not.toContain(config.databaseUrl);
  });

  test('rejects unauthenticated private endpoints', async () => {
    const endpoints = [
      '/api/me',
      '/api/settings',
      '/api/projects',
      '/api/experiments',
      '/api/hypotheses',
      '/api/results',
      '/api/notes',
    ];
    for (const path of endpoints) {
      const res = await request(app).get(path);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    }
  });

  test('rejects invalid registration input', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'short',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('register, session, login, logout flow', async () => {
    const email = `user-${Date.now()}@example.com`;
    const password = 'phase1-test-password';
    const agent = request.agent(app);

    const register = await agent.post('/api/auth/register').send({
      email,
      password,
      displayName: 'Phase One',
    });
    expect(register.status).toBe(201);
    expect(register.body.user.email).toBe(email.toLowerCase());
    expect(register.body.user.displayName).toBe('Phase One');
    expect(register.body.user.password_hash).toBeUndefined();
    expect(register.body.user.passwordHash).toBeUndefined();

    const session = await agent.get('/api/auth/session');
    expect(session.status).toBe(200);
    expect(session.body.authenticated).toBe(true);
    expect(session.body.user.email).toBe(email.toLowerCase());

    const me = await agent.get('/api/me');
    expect(me.status).toBe(200);
    expect(me.body.user.id).toBe(session.body.user.id);

    const logout = await agent.post('/api/auth/logout');
    expect(logout.status).toBe(204);

    const sessionAfter = await agent.get('/api/auth/session');
    expect(sessionAfter.body.authenticated).toBe(false);

    const loginRes = await agent.post('/api/auth/login').send({ email, password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.email).toBe(email.toLowerCase());

    const session2 = await agent.get('/api/auth/session');
    expect(session2.body.authenticated).toBe(true);
  });

  test('ownership protection hides other users resources', async () => {
    const password = 'ownership-test-password';
    const agentA = request.agent(app);
    const agentB = request.agent(app);

    const userA = await agentA.post('/api/auth/register').send({
      email: `a-${Date.now()}@example.com`,
      password,
      displayName: 'User A',
    });
    expect(userA.status).toBe(201);

    const userB = await agentB.post('/api/auth/register').send({
      email: `b-${Date.now()}@example.com`,
      password,
      displayName: 'User B',
    });
    expect(userB.status).toBe(201);

    const project = await agentA.post('/api/projects').send({
      title: 'A private project',
      researchQuestion: 'Only A should see this',
    });
    expect(project.status).toBe(201);
    const projectId = project.body.project.id as string;

    const experiment = await agentA.post('/api/experiments').send({
      projectId,
      name: 'Secret experiment',
      researchQuestion: 'hidden',
    });
    expect(experiment.status).toBe(201);
    const experimentId = experiment.body.experiment.id as string;

    const note = await agentA.post('/api/notes').send({
      projectId,
      experimentId,
      title: 'Private note',
      bodyNotes: 'confidential',
    });
    expect(note.status).toBe(201);

    const crossProject = await agentB.get(`/api/projects/${projectId}`);
    expect(crossProject.status).toBe(404);
    expect(crossProject.body.error.code).toBe('NOT_FOUND');

    const crossExperiment = await agentB.get(`/api/experiments/${experimentId}`);
    expect(crossExperiment.status).toBe(404);

    const crossNote = await agentB.get(`/api/notes/${note.body.note.id}`);
    expect(crossNote.status).toBe(404);

    const listB = await agentB.get('/api/projects');
    expect(listB.status).toBe(200);
    expect(listB.body.projects).toEqual([]);
  });

  test('settings round-trip for authenticated user', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({
      email: `settings-${Date.now()}@example.com`,
      password: 'settings-test-password',
    });

    const put = await agent.put('/api/settings').send({
      preferences: { languageLevel: 'standard', showDemoContent: false },
    });
    expect(put.status).toBe(200);
    expect(put.body.preferences.languageLevel).toBe('standard');

    const get = await agent.get('/api/settings');
    expect(get.status).toBe(200);
    expect(get.body.preferences.showDemoContent).toBe(false);
  });
});
