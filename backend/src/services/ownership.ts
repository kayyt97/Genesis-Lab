import type { DbPool } from '../db/pool.js';
import { notFound } from '../errors.js';

/**
 * Load a row owned by the current user. Returns the same 404 for missing and
 * cross-user access to avoid IDOR existence leaks.
 */
export async function requireOwnedRow<T extends Record<string, unknown>>(
  pool: DbPool,
  table: string,
  id: string,
  userId: string,
): Promise<T> {
  // Table names are internal constants only — never from user input.
  const allowed = new Set([
    'projects',
    'experiments',
    'hypotheses',
    'results',
    'research_notes',
  ]);
  if (!allowed.has(table)) {
    throw new Error('Invalid ownership table');
  }

  const result = await pool.query<T>(
    `SELECT * FROM ${table} WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [id, userId],
  );

  if (!result.rowCount) {
    throw notFound();
  }

  return result.rows[0];
}

export async function assertOwnedForeignKey(
  pool: DbPool,
  table: 'projects' | 'experiments',
  id: string | null | undefined,
  userId: string,
): Promise<void> {
  if (!id) return;
  await requireOwnedRow(pool, table, id, userId);
}
