# Filecase

Filecase is a Bun monorepo for accountant document management.

## Workspace Layout

- `apps/web`: TanStack Start app (UI + server functions)
- `packages/ui`: shared shadcn/ui components
- `packages/shared`: shared Zod schemas/types
- `docs/adr`: architectural decisions

## Requirements

- Bun 1.2+
- Docker (local Postgres)
- Cloudflare R2 bucket + access keys

## Environment Files

- `.env.example`: baseline local/dev template
- `.env.local`: local overrides (gitignored)
- `.env.production.example`: production template

Copy and edit for local development:

```bash
cp .env.example .env
cp .env.example .env.local
```

### Secrets Policy

- Keep real credentials only in `.env.local` (and deployment secret managers in production).
- Keep `.env`, `.env.example`, and `.env.production.example` free of real secrets.
- Never commit live R2 keys, session secrets, or production database credentials.
- If a secret is accidentally exposed, rotate it immediately.

## Local Dev Quickstart

```bash
bun install
bun run db:up
bun run db:migrate
bun run db:seed
bun run dev
```

App: `http://localhost:3000`

Seeded users:
- Admin: `SEED_ADMIN_EMAIL`
- Manager: `manager@demo.local`
- Staff: `staff@demo.local`
- Password for all: `SEED_ADMIN_PASSWORD`

## Root Commands

```bash
bun run dev
bun run build
bun run lint
bun run typecheck
bun run test
bun run format
bun run db:up
bun run db:up:tools
bun run db:down
bun run db:reset
bun run db:migrate
bun run db:seed
bun run db:generate
```

## Security and Runtime Notes

- Env is validated at startup via Zod (`apps/web/src/server/env.ts`).
- Production safety checks enforce:
  - `SESSION_SECRET` minimum length (32)
  - `APP_ORIGIN` must be `https://`
- Sessions are DB-backed and cookie-based (`httpOnly`, `SameSite=Lax`, `Secure` in production).
- Multi-tenant and assignment RBAC checks are enforced server-side for data access.
- Rate limits:
  - Login: per-IP and per-email
  - Upload: per-user and per-firm
  - On limit hit, server returns `429` with `Retry-After`.
- Health endpoint: `GET /health` (DB connectivity, fast response, no-store cache headers).

## R2 and Uploads

- R2 setup guide: `docs/r2-setup.md`
- Upload mime allowlist is controlled by `ALLOWED_UPLOAD_MIME_TYPES`.
- Maximum upload size is controlled by `MAX_UPLOAD_BYTES`.

## CI

GitHub Actions workflow: `.github/workflows/ci.yml`

Runs on PR + `main`:
- install
- lint
- typecheck
- migrations
- seed
- tests

Uses a Postgres service container.

## Deploy and Operations

- Deploy guide: `docs/deploy.md`
- Backup/restore guidance: `docs/backup-and-restore.md`

## ADRs

- `docs/adr/0001-db-auth-tenancy.md`
- `docs/adr/0002-file-storage-r2.md`
- `docs/adr/0004-assignments-and-rbac.md`
- `docs/adr/0005-document-discovery-and-bulk-actions.md`
- `docs/adr/0006-audit-log-and-exports.md`
