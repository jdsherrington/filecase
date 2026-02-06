# ADR 0002: File Storage with Cloudflare R2

## Status

Accepted

## Context

Filecase must store private client documents with strict tenant isolation, support version history, and issue short-lived download links without exposing permanent object URLs.

## Decisions

- Use Cloudflare R2 (S3-compatible) with AWS SDK v3.
- Use private buckets only; no public bucket/object access.
- Store only `storage_key` in DB (`document_versions.storage_key`).
- Generate signed download URLs server-side only with short TTL (`FILE_DOWNLOAD_TTL_SECONDS`).
- Enforce auth + firm scoping before any signed URL generation.

## Key structure

Document objects use firm-scoped deterministic keys:

`firms/{firmId}/clients/{clientId}/engagements/{engagementId}/documents/{documentId}/v{version}/{fileName}`

`fileName` is sanitized server-side to prevent path traversal and unsafe characters.

## Consistency strategy (MVP)

For upload and replacement:

1. Insert DB rows in a transaction.
2. Upload object to R2 inside that transaction flow.
3. If upload fails, throw and roll back transaction.
4. If any error occurs after key allocation, attempt best-effort object cleanup with `deleteObject`.

This keeps DB and storage mostly consistent for MVP while staying simple.

## Audit logging

Write `audit_logs` entries for:

- `upload` (entity: `document_version`)
- `download` (entity: `document_version`)

## MVP limitations

- No multipart uploads yet.
- No direct browser-to-R2 uploads yet.
- No background reconciliation job for orphaned objects.
- Download links are single TTL-based URLs without per-link revocation.
