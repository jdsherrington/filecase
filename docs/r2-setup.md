# R2 Setup

## 1. Create bucket

1. Open Cloudflare Dashboard.
2. Go to `R2`.
3. Create a bucket (private), for example `filecase-documents`.
4. Do not enable public access.

## 2. Create access keys

1. In R2, open `Manage R2 API tokens`.
2. Create token with read/write access to the Filecase bucket.
3. Save:
   - Access Key ID
   - Secret Access Key
   - Account ID

## 3. Configure environment

Set the following variables in root `.env`:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_ENDPOINT` (optional; if empty app derives `https://<account-id>.r2.cloudflarestorage.com`)
- `FILE_DOWNLOAD_TTL_SECONDS`
- `MAX_UPLOAD_BYTES`

## 4. Optional CORS

For browser-based signed URL downloads, default setup usually works. If required, set CORS on bucket:

- Allowed origins: your app origin (e.g. `http://localhost:3000`)
- Allowed methods: `GET`
- Allowed headers: `*`
- Expose headers: `ETag`

## 5. Verify

1. Start app and login.
2. Upload document in engagement flow.
3. Download via generated signed URL.
