import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

function loadDotEnvSync(): void {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;
    const text = fs.readFileSync(envPath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // Production relies on real environment variables from the host.
  }
}

loadDotEnvSync();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().positive().default(3100),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be at least 16 characters'),
  ALLOWED_ORIGIN: z.string().default('http://localhost:5173'),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      return v === '1' || v.toLowerCase() === 'true';
    }),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(14),
});

export type AppConfig = {
  nodeEnv: 'development' | 'test' | 'production';
  host: string;
  port: number;
  databaseUrl: string;
  sessionSecret: string;
  allowedOrigin: string;
  cookieSecure: boolean;
  sessionTtlDays: number;
  sessionCookieName: string;
};

let cached: AppConfig | null = null;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  if (cached && env === process.env) return cached;

  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid backend configuration: ${details}`);
  }

  const data = parsed.data;
  const cookieSecure = data.COOKIE_SECURE ?? data.NODE_ENV === 'production';

  const config: AppConfig = {
    nodeEnv: data.NODE_ENV,
    host: data.HOST,
    port: data.PORT,
    databaseUrl: data.DATABASE_URL,
    sessionSecret: data.SESSION_SECRET,
    allowedOrigin: data.ALLOWED_ORIGIN,
    cookieSecure,
    sessionTtlDays: data.SESSION_TTL_DAYS,
    sessionCookieName: 'genesis_session',
  };

  if (env === process.env) cached = config;
  return config;
}

/** Test helper: reset memoized config. */
export function resetConfigCache(): void {
  cached = null;
}
