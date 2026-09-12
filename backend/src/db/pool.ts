import pg from 'pg';
import type { AppConfig } from '../config.js';

const { Pool } = pg;

export type DbPool = pg.Pool;

export function createPool(config: AppConfig): DbPool {
  return new Pool({
    connectionString: config.databaseUrl,
    // Private localhost listener in production; keep pool modest for Phase 1.
    max: config.nodeEnv === 'production' ? 10 : 5,
  });
}

export async function checkDatabase(pool: DbPool): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    return true;
  } finally {
    client.release();
  }
}
