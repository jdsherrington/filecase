# ADR 0004: Assignments and Resource-Scoped RBAC

## Status

Accepted

## Context

Role-only authorization is not sufficient for Filecase. Staff users must only see client, engagement, and document data they are explicitly assigned to, while admin and manager roles retain broad firm-level access.

## Decisions

### Assignment model

Use two assignment tables:

- `client_assignments (firm_id, client_id, user_id, created_by_user_id, created_at)`
- `engagement_assignments (firm_id, engagement_id, user_id, created_by_user_id, created_at)`

Both tables include unique constraints on `(resource_id, user_id)` and firm-scoped indexes for lookup performance.

Why both levels:

- Client assignments support top-level client visibility.
- Engagement assignments support finer-grained engagement/document visibility and future workflow delegation.

### Authorization rules

- `admin`: full firm access to clients, engagements, documents, and assignment management.
- `manager`: full firm access to clients, engagements, documents, and assignment management.
- `staff`:
  - Can read a client if assigned directly to client OR assigned to at least one engagement under that client.
  - Can read an engagement only if assigned to that engagement.
  - Can read a document only if its engagement is assigned.
  - Is read-only for client/engagement/document writes in MVP.

### Unauthorized response strategy

Use `404` behavior (`NOT_FOUND`) for unauthorized resource reads on scoped entities.

Rationale:

- Avoids resource enumeration across firm/user boundaries.
- Keeps response behavior consistent for "not present" vs "not visible" in staff paths.

### Enforcement point

Authorization is enforced server-side in policy/data functions used by server functions and queries. UI visibility is not treated as security.

### Auditing

Assignment changes write `audit_logs` entries:

- `action = permission_change`
- `entity_type = client_assignment | engagement_assignment`
- Metadata includes target user, resource ID, and `change = assign | unassign`.

## MVP limitations

- No team/group-based assignment model yet.
- No inherited write access for staff; staff remains read-only.
- No bulk assignment workflows yet.
