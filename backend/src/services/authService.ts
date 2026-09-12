import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { argon2id, argon2Verify } from 'hash-wasm';
import type { AppConfig } from '../config.js';
import type { DbPool } from '../db/pool.js';
import { badRequest, conflict, unauthorized } from '../errors.js';
import type { AuthUserRow, PublicUser } from '../types/api.js';

const EMAIL_MAX = 320;
const PASSWORD_MIN = 10;
const PASSWORD_MAX = 200;

/** Argon2id parameters (OWASP-inspired; WASM implementation — no native build required). */
const ARGON2_OPTS = {
  parallelism: 1,
  iterations: 3,
  memorySize: 65536, // KiB
  hashLength: 32,
} as const;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function assertPasswordPolicy(password: string): void {
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    throw badRequest(
      'VALIDATION_ERROR',
      `Password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters`,
    );
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  return argon2id({
    password,
    salt,
    ...ARGON2_OPTS,
    outputType: 'encoded',
  });
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await argon2Verify({ password, hash: passwordHash });
  } catch {
    return false;
  }
}

export function hashSessionToken(rawToken: string, sessionSecret: string): string {
  return createHmac('sha256', sessionSecret).update(rawToken).digest('hex');
}

export function hashIpPrivacy(ip: string | undefined, sessionSecret: string): string | null {
  if (!ip) return null;
  return createHash('sha256').update(`${sessionSecret}:ip:${ip}`).digest('hex');
}

export function createSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function toPublicUser(row: AuthUserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name ?? '',
    status: row.status,
    emailVerifiedAt: row.email_verified_at ? row.email_verified_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    lastLoginAt: row.last_login_at ? row.last_login_at.toISOString() : null,
  };
}

async function loadUserByEmail(pool: DbPool, email: string): Promise<AuthUserRow | null> {
  const result = await pool.query<AuthUserRow>(
    `SELECT u.*, p.display_name
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE LOWER(u.email) = LOWER($1)
     LIMIT 1`,
    [email],
  );
  return result.rows[0] ?? null;
}

async function loadUserById(pool: DbPool, userId: string): Promise<AuthUserRow | null> {
  const result = await pool.query<AuthUserRow>(
    `SELECT u.*, p.display_name
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE u.id = $1
     LIMIT 1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

export async function registerUser(
  pool: DbPool,
  config: AppConfig,
  input: { email: string; password: string; displayName?: string },
  meta: { userAgent?: string; ip?: string },
): Promise<{ user: PublicUser; rawToken: string; expiresAt: Date }> {
  const email = normalizeEmail(input.email);
  if (!email || email.length > EMAIL_MAX || !email.includes('@')) {
    throw badRequest('VALIDATION_ERROR', 'A valid email is required');
  }
  assertPasswordPolicy(input.password);

  const existing = await loadUserByEmail(pool, email);
  if (existing) {
    throw conflict('EMAIL_IN_USE', 'An account with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);
  const displayName = (input.displayName ?? '').trim().slice(0, 120);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userInsert = await client.query<{ id: string }>(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id`,
      [email, passwordHash],
    );
    const userId = userInsert.rows[0].id;

    await client.query(
      `INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2)`,
      [userId, displayName],
    );
    await client.query(
      `INSERT INTO user_settings (user_id, preferences) VALUES ($1, $2::jsonb)`,
      [userId, JSON.stringify({})],
    );

    const rawToken = createSessionToken();
    const tokenHash = hashSessionToken(rawToken, config.sessionSecret);
    const expiresAt = new Date(Date.now() + config.sessionTtlDays * 24 * 60 * 60 * 1000);
    const ipHash = hashIpPrivacy(meta.ip, config.sessionSecret);

    await client.query(
      `INSERT INTO sessions (user_id, token_hash, expires_at, user_agent, ip_hash)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, tokenHash, expiresAt, meta.userAgent ?? null, ipHash],
    );

    await client.query(`UPDATE users SET last_login_at = now(), updated_at = now() WHERE id = $1`, [
      userId,
    ]);

    await client.query('COMMIT');

    const user = await loadUserById(pool, userId);
    if (!user) throw new Error('User missing after register');
    return { user: toPublicUser(user), rawToken, expiresAt };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function loginUser(
  pool: DbPool,
  config: AppConfig,
  input: { email: string; password: string },
  meta: { userAgent?: string; ip?: string },
): Promise<{ user: PublicUser; rawToken: string; expiresAt: Date }> {
  const email = normalizeEmail(input.email);
  const fail = () => unauthorized('Invalid email or password');
  if (!input.password || input.password.length > PASSWORD_MAX) {
    throw fail();
  }

  const user = await loadUserByEmail(pool, email);
  // Uniform failure message — do not reveal whether email exists.

  if (!user || user.status !== 'active') {
    // Dummy verify to reduce timing oracle differences.
    await hashPassword(input.password).catch(() => undefined);
    throw fail();
  }

  const ok = await verifyPassword(user.password_hash, input.password);
  if (!ok) throw fail();

  const rawToken = createSessionToken();
  const tokenHash = hashSessionToken(rawToken, config.sessionSecret);
  const expiresAt = new Date(Date.now() + config.sessionTtlDays * 24 * 60 * 60 * 1000);
  const ipHash = hashIpPrivacy(meta.ip, config.sessionSecret);

  await pool.query(
    `INSERT INTO sessions (user_id, token_hash, expires_at, user_agent, ip_hash)
     VALUES ($1, $2, $3, $4, $5)`,
    [user.id, tokenHash, expiresAt, meta.userAgent ?? null, ipHash],
  );
  await pool.query(`UPDATE users SET last_login_at = now(), updated_at = now() WHERE id = $1`, [
    user.id,
  ]);

  const refreshed = await loadUserById(pool, user.id);
  return {
    user: toPublicUser(refreshed ?? user),
    rawToken,
    expiresAt,
  };
}

export async function resolveSession(
  pool: DbPool,
  config: AppConfig,
  rawToken: string,
): Promise<{ user: PublicUser; sessionId: string } | null> {
  if (!rawToken || rawToken.length > 200) return null;
  const tokenHash = hashSessionToken(rawToken, config.sessionSecret);

  const result = await pool.query<{
    session_id: string;
    expires_at: Date;
    revoked_at: Date | null;
  } & AuthUserRow>(
    `SELECT s.id AS session_id, s.expires_at, s.revoked_at,
            u.id, u.email, u.password_hash, u.email_verified_at, u.status,
            u.created_at, u.updated_at, u.last_login_at, p.display_name
     FROM sessions s
     INNER JOIN users u ON u.id = s.user_id
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE s.token_hash = $1
     LIMIT 1`,
    [tokenHash],
  );

  const row = result.rows[0];
  if (!row) return null;
  if (row.revoked_at) return null;
  if (row.expires_at.getTime() <= Date.now()) return null;
  if (row.status !== 'active') return null;

  return {
    sessionId: row.session_id,
    user: toPublicUser(row),
  };
}

export async function revokeSession(pool: DbPool, sessionId: string): Promise<void> {
  await pool.query(
    `UPDATE sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL`,
    [sessionId],
  );
}

export async function updateProfile(
  pool: DbPool,
  userId: string,
  displayName: string,
): Promise<PublicUser> {
  const name = displayName.trim().slice(0, 120);
  await pool.query(
    `UPDATE user_profiles SET display_name = $1, updated_at = now() WHERE user_id = $2`,
    [name, userId],
  );
  const user = await loadUserById(pool, userId);
  if (!user) throw unauthorized();
  return toPublicUser(user);
}

/** Constant-time compare helper for tests / token checks */
export function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'hex');
    const bb = Buffer.from(b, 'hex');
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}
