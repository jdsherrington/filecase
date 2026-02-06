# Deploy (Container-based)

Filecase uses a container-first deploy path for MVP.

## 1) Build image

```bash
docker build -t filecase:latest .
```

## 2) Run container

```bash
docker run --rm -p 3000:3000 \
  --env-file .env.production \
  filecase:latest
```

## 3) Required production env vars

- `DATABASE_URL`
- `SESSION_COOKIE_NAME`
- `SESSION_SECRET` (must be at least 32 chars in production)
- `APP_ORIGIN` (must be https in production)
- `NODE_ENV=production`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `FILE_DOWNLOAD_TTL_SECONDS`
- `MAX_UPLOAD_BYTES`
- `ALLOWED_UPLOAD_MIME_TYPES`

Optional:
- `R2_ENDPOINT`
- `R2_PUBLIC_BASE_URL`
- `LOG_LEVEL`
- `HEALTHCHECK_R2_ENABLED`

## 4) Pre-deploy checks

```bash
bun run lint
bun run typecheck
bun run test
bun run db:migrate
```

## 5) Runtime checks

- Health endpoint: `GET /health`
- App endpoint: `GET /login`

