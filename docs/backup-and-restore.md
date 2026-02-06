# Backup and Restore Guidance

## Postgres backups

Use logical backups with `pg_dump` and test restore regularly.

```bash
pg_dump "$DATABASE_URL" --format=custom --file=filecase-$(date +%F).dump
```

Restore example:

```bash
pg_restore --clean --if-exists --no-owner --dbname "$DATABASE_URL" filecase-YYYY-MM-DD.dump
```

Recommended cadence (MVP):
- Daily backups
- Keep at least 14 days
- Store backup artifacts off-host

## R2 objects

Enable Cloudflare R2 object versioning and lifecycle policies in production.
Use lifecycle rules for non-current version retention to control cost.

## Audit log retention

Audit logs are append-only from UI perspective and should be retained for compliance.
Recommended MVP retention target: at least 1 year.
If pruning is required, export and archive before deletion.
