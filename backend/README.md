# Genesis Lab Backend (Phase 1)

Node.js + TypeScript REST API for Genesis Lab authentication and user-owned research data.

The React/Vite frontend is **not** connected to this API yet. Browser `localStorage` (`genesis-lab-state-v3`) remains the active client persistence mechanism.

## Stack

- Express (HTTP)
- PostgreSQL (`pg` with parameterized queries)
- Zod (request validation)
- Argon2id via `hash-wasm` (portable WASM; no native compiler required on Windows)
- Server-side sessions (HttpOnly cookie)

## Production assumptions (JRE)

| Item | Value |
|------|--------|
| Database | PostgreSQL database `genesis` |
| DB role | `genesis_app` |
| Listen | `127.0.0.1:3100` (private) |
| systemd | `genesis-backend` |
| Public path | nginx proxies `/api/` → backend |

**Production secrets are supplied by JRE's protected environment. Never commit real credentials, connection strings, or session secrets.**

## Required environment variable names

See `.env.example`. Names only:

```
DATABASE_URL=
SESSION_SECRET=
PORT=
HOST=
NODE_ENV=
ALLOWED_ORIGIN=
COOKIE_SECURE=
SESSION_TTL_DAYS=
```

Local development: copy `.env.example` to `.env` and fill in values for your machine. Do not commit `.env`.

## Local development setup

Requires Bun (project standard) or Node.js 20+. Application code avoids Bun-only APIs so production can run on Node.

```bash
cd backend
bun install
# configure .env with DATABASE_URL and SESSION_SECRET (16+ chars)
bun run migrate
bun run dev
```

Backend listens on `HOST`/`PORT` (default `127.0.0.1:3100`).

### Scripts

| Script | Purpose |
|--------|---------|
| `bun run dev` | Watch mode via `tsx` |
| `bun run typecheck` | TypeScript check |
| `bun run build` | Compile to `dist/` |
| `bun run start` | Run compiled `dist/index.js` (Node) |
| `bun run migrate` | Apply SQL migrations |
| `bun run test` | Backend tests |

Equivalent `npm run …` commands work if npm is available.

## Database migrations

Migrations live in `src/db/migrations/` and are applied in filename order.

```bash
bun run migrate
```

Phase 1 creates: `users`, `sessions`, `user_profiles`, `user_settings`, `projects`, `experiments`, `hypotheses`, `results`, `research_notes`, plus `schema_migrations`.

## Authentication model

1. Register / login with email + password.
2. Password stored only as **Argon2id** hash (`password_hash` never returned by the API).
3. A random session token is issued; only an **HMAC-SHA256 hash** of the token is stored in `sessions`.
4. The raw token is sent to the browser as the **HttpOnly** cookie `genesis_session` (`Secure` in production, `SameSite=Lax`).
5. Authenticated routes resolve the cookie → session row → `users.id`.
6. **Never trust a client-supplied `user_id`.** Ownership always comes from the session.
7. Register/login are rate-limited per IP.

## Security / ownership model

- Every private row includes `user_id`.
- Reads/updates/deletes use `WHERE id = $1 AND user_id = $2`.
- Cross-user access returns **404** (same as missing) to avoid IDOR existence leaks.
- Errors use `{ "error": { "code", "message" } }` without stack traces, SQL, or secrets.

## API overview (Phase 1)

All routes are under `/api`.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/health` | No | Liveness + optional DB check |
| GET | `/api/auth/session` | Optional | Current session |
| POST | `/api/auth/register` | No | Create account + session |
| POST | `/api/auth/login` | No | Login + session |
| POST | `/api/auth/logout` | Yes | Revoke session |
| GET/PATCH | `/api/me` | Yes | Current user profile |
| GET/PUT | `/api/settings` | Yes | Preferences JSON |
| CRUD | `/api/projects` | Yes | Research projects |
| CRUD | `/api/experiments` | Yes | Experiments |
| CRUD | `/api/hypotheses` | Yes | Hypotheses |
| CRUD | `/api/results` | Yes | Simulation results |
| CRUD | `/api/notes` | Yes | Research notes |

## Out of scope (Phase 1)

- Frontend API integration
- localStorage migration / removal
- Genomic file storage
- Realtime features
- Extra P1/P2 tables (samples, therapeutics, etc.)

## License / ownership

Part of the Genesis Lab project. Backend code follows the same project ownership as the repository root.
