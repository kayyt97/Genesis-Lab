import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { newDb, DataType } from 'pg-mem';
import type { DbPool } from '../db/pool.js';
import type { AppConfig } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function testConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    nodeEnv: 'test',
    host: '127.0.0.1',
    port: 3100,
    databaseUrl: 'postgres://test:test@127.0.0.1:5432/genesis_test',
    sessionSecret: 'test-session-secret-32chars-min',
    allowedOrigin: 'http://localhost:5173',
    cookieSecure: false,
    sessionTtlDays: 14,
    sessionCookieName: 'genesis_session',
    ...overrides,
  };
}

export async function createTestPool(): Promise<DbPool> {
  const db = newDb({ autoCreateForeignKeyIndices: true });

  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.uuid,
    implementation: () => randomUUID(),
    impure: true,
  });

  // pg-mem may not implement now() as timestamptz the same way; built-in usually works.
  const migrationPath = path.join(__dirname, '../db/migrations/001_init.sql');
  let sql = fs.readFileSync(migrationPath, 'utf8');
  // Remove extension statement — pg-mem does not need pgcrypto when we register UUID.
  sql = sql.replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto;\s*/i, '');

  db.public.none(sql);

  const adapter = db.adapters.createPg();
  const pool = new adapter.Pool() as unknown as DbPool;
  return pool;
}
