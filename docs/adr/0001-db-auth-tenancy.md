# ADR 0001: DB, Auth, and Tenancy Foundation

## Status

Accepted

## Context

Filecase is an accountant-focused SaaS where all domain data must be isolated per accounting firm from day one. We need a boring, maintainable baseline for data access, authentication, and authorization.

## Decisions

### Database and migrations

- Use PostgreSQL as the source of truth.
- Use Drizzle ORM + drizzle-kit for schema definition and SQL migrations.
- Keep `firm_id` on tenant domain tables (`users`, `clients`, `engagements`, `documents`, `audit_logs`, `sessions`) and enforce scoping in query helpers.
- Use restrictive foreign keys (`ON DELETE RESTRICT`) by default to avoid accidental cascading deletes.

### User identity model

- `users.email` is globally unique across the system in MVP.
- One user belongs to one firm in MVP.
- Memberships table is intentionally deferred to keep scope small.

### Sessions and cookies

- Use DB-backed sessions in `sessions` table.
- Session cookie is `httpOnly`, `SameSite=Lax`, `Secure` in production.
- Session lookup validates expiry and updates `last_seen_at`.
- Logout removes DB session and clears cookie.

### Tenancy enforcement

- Central tenant resolver: `resolveTenantContext(request)`.
- Scoped queries use `withFirmScope(...)` and domain query functions (e.g. clients list).
- Protected routes call server-side auth checks before loading.

### RBAC (MVP)

- `admin`: full access including user management.
- `manager`: full domain access except user management.
- `staff`: read-only for domain resources in MVP.
- Assigned-resource constraints for staff are deferred.

## Why this approach

- Drizzle keeps schema and TypeScript models close, with explicit SQL migrations.
- DB sessions are straightforward to revoke/audit and avoid JWT revocation complexity.
- Explicit server-side tenancy checks reduce accidental cross-firm leaks.

## Known MVP limitations

- No rate limiting on login yet.
- No multi-firm memberships per user yet.
- No staff assignment model yet; staff uses read-only fallback.
- No row-level security policies yet; app-level firm scoping is enforced in code.
