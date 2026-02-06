# ADR 0005: Document Discovery, Lifecycle, and Bulk Actions

## Status

Accepted

## Context

Daily accounting work requires rapid triage of many documents across engagements. We need searchable lists, explicit lifecycle controls, and safe bulk updates without relaxing tenancy or assignment RBAC constraints.

## Decisions

### Search approach

Use PostgreSQL `ILIKE` for MVP text search over:

- `documents.title`
- latest `document_versions.file_name`

Why `ILIKE` over full-text search right now:

- Lower complexity and migration overhead for MVP.
- Sufficient for expected early dataset size.
- Keeps query behavior explicit and easy to debug.

### Query shape and indexes

List queries resolve the latest version per document via grouped latest-version subquery and filter/sort on joined metadata.

Added index support:

- `documents.updated_at` index (`documents_updated_at_idx`)

Existing firm-scope indexes continue to enforce efficient tenant filtering.

### Pagination and sorting

Use `limit`/`offset` pagination for MVP.

- Default sort: `updated_at desc`
- Supported sort fields: `title`, `created_at`, `updated_at`, `status`

### Lifecycle rules

Document statuses:

- `uploaded -> in_review -> final`
- Reverse `final -> in_review` is allowed only for `admin` and `manager`.

Status updates always run server-side policy checks and update `documents.updated_at`.

### Bulk update strategy and audit

Bulk status updates are executed server-side and validate authorization per document before update.

Audit behavior:

- `action = bulk_update`
- `entity_type = document`
- metadata includes `document_ids`, `changes`, and `count`

### Tags decision

Tags are not implemented in Task 5.

Reason:

- Keep this iteration focused on lifecycle/discovery throughput with clear server-side RBAC guarantees.

TODO:

- Add `tags` and `document_tags` tables.
- Add tag filters and bulk tag assignment/removal.
- Add tag-specific audit metadata semantics.

## MVP limitations

- Search is case-insensitive pattern matching, not ranked relevance.
- `limit`/`offset` pagination can degrade for very large offsets.
- No saved filters/views yet.
