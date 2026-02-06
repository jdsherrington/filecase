# ADR 0006: Audit Log Access, Coverage, and CSV Exports

## Status

Accepted

## Context

Filecase needs operationally useful auditability for accountants and firm admins. The system must answer who performed key actions and allow exports for compliance and review.

## Decisions

### Access rules

- `admin` and `manager` can view firm-wide audit logs and export CSV.
- `staff` can only read their own events at the service level.
- `/audit` UI route is restricted to `admin` and `manager`.

Rationale:

- Managers need cross-team visibility for day-to-day operations.
- Staff access is constrained to avoid accidental firm-wide visibility leakage.

### Event coverage

Server-side audit events cover:

- Auth: `auth.login`, `auth.logout`
- Documents:
  - `upload` (initial upload and replacement version)
  - `download`
  - `status_change`
  - `bulk_update` (bulk status)
- Assignments:
  - `permission_change` for assign/unassign client/engagement

Each event includes resource IDs when relevant (`client_id`, `engagement_id`, `document_id`, `document_version_id`, `target_user_id`) and lifecycle metadata (`previous_status`, `new_status`).

### Request context in metadata

Audit writes include best-effort request context:

- `request_ip`
- `request_user_agent`

If values are unavailable, audit writes still succeed.

### View events

Document view events are not recorded.

Rationale:

- Avoid high-volume noise that lowers signal quality.
- Keep write amplification low for MVP.

### Export strategy

CSV export is generated server-side and respects current filters.

- Max rows per export: `10,000`
- If limit is exceeded, export is truncated and the UI warns the user.
- CSV columns:
  - `created_at`
  - `user_email`
  - `action`
  - `entity_type`
  - `entity_id`
  - `metadata_json`

Rationale:

- Cap prevents accidental heavy exports and protects DB/query latency in MVP.

## MVP limitations

- No full-text metadata search in `/audit` yet.
- No async export job; export is synchronous.
- No immutable external archive sink yet.
