-- Genesis Lab Phase 1 schema
-- Database: genesis (application role: genesis_app)
-- All private rows are owned via user_id; API must never trust client-supplied user ids.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uidx ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  user_agent TEXT,
  ip_hash TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_hash_uidx ON sessions (token_hash);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  research_question TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  include_genomic_data BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_user_updated_idx ON projects (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects (id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  research_question TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  sample_id TEXT,
  organism_id TEXT,
  control_group TEXT NOT NULL DEFAULT '',
  experimental_group TEXT NOT NULL DEFAULT '',
  duration_hours DOUBLE PRECISION NOT NULL DEFAULT 0,
  environment JSONB NOT NULL DEFAULT '{}'::jsonb,
  independent_variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  dependent_variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  controlled_variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  compound_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  observations JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT NOT NULL DEFAULT '',
  simulation_seed INTEGER,
  variability_enabled BOOLEAN NOT NULL DEFAULT false,
  parent_experiment_id UUID REFERENCES experiments (id) ON DELETE SET NULL,
  client_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS experiments_user_updated_idx ON experiments (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS experiments_user_project_idx ON experiments (user_id, project_id);
CREATE INDEX IF NOT EXISTS experiments_user_status_idx ON experiments (user_id, status);
CREATE INDEX IF NOT EXISTS experiments_user_client_id_idx ON experiments (user_id, client_id);

CREATE TABLE IF NOT EXISTS hypotheses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES experiments (id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects (id) ON DELETE SET NULL,
  statement TEXT NOT NULL DEFAULT '',
  workflow JSONB NOT NULL DEFAULT '{}'::jsonb,
  verdict TEXT
    CHECK (verdict IS NULL OR verdict IN ('supports', 'does-not-support', 'inconclusive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hypotheses_user_updated_idx ON hypotheses (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS hypotheses_user_experiment_idx ON hypotheses (user_id, experiment_id);

CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES experiments (id) ON DELETE SET NULL,
  simulation_id TEXT,
  summary TEXT NOT NULL DEFAULT '',
  final_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  control_comparison JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS results_user_created_idx ON results (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS results_user_experiment_idx ON results (user_id, experiment_id);

CREATE TABLE IF NOT EXISTS research_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES experiments (id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects (id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body_notes TEXT NOT NULL DEFAULT '',
  observations TEXT NOT NULL DEFAULT '',
  hypothesis_text TEXT NOT NULL DEFAULT '',
  conclusions TEXT NOT NULL DEFAULT '',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  entry_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS research_notes_user_updated_idx ON research_notes (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS research_notes_user_experiment_idx ON research_notes (user_id, experiment_id);
