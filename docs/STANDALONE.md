# Run Classroom Spark independently

This setup uses a fresh PostgreSQL database and a private local PDF volume. No data is imported from the old host. Replit tooling, its AI integration, its database service, and its object-storage sidecar are not required.

## Start locally with Docker

Install Docker with Compose v2 on the machine that will run the app. From the repository root:

```sh
cp .env.example .env
```

Set `POSTGRES_PASSWORD` in `.env` to a strong new password. Leave visitor OpenAI keys out of this file. Then run:

```sh
docker compose up --build --detach --wait
```

Open **http://localhost:8080**. The first startup applies the committed SQL migrations to the new database. Later starts apply only new migrations. The app and API share this origin, so a separate frontend service is unnecessary.

Choose **AI key** in the header and enter your own OpenAI key. It stays in memory until refresh. The subtle line beneath **Create board** reports this visit's returned token usage. See [BYOK details](BYOK.md).

The service binds only to `127.0.0.1` by default. That is appropriate for local use and avoids making an unprotected teacher workspace publicly reachable. `APP_PORT` changes the local port. To run on another server, use the same Compose project with persistent volumes and an HTTPS reverse proxy that enforces account access. Do not expose the development server as the production service.

## What runs

| Service | Purpose | Persistence |
| --- | --- | --- |
| `app` | Node 24 API and built React frontend; non-root user | Private PDFs in the `pdfs` named volume |
| `db` | Standard PostgreSQL 16 | Records and migration journal in the `postgres` named volume |

Database passwords are passed through standard PostgreSQL environment variables, so special characters do not need URL encoding. The database has no published host port. There is no owner AI key, app-password service, or mandatory third-party storage account.

`docker compose down` stops the services while keeping the named volumes. Back up both the database and PDF volume. Deleting volumes deletes the new workspace's data.

## Private curriculum sources

BYOK does not authenticate a visitor or isolate database records. This remains one shared teacher workspace. Curriculum documents and historical private excerpts are disabled/redacted by default.

After a hosting layer genuinely enforces sign-in, set `DEPLOYMENT_ACCESS_PROTECTED=true` and recreate the app service. This flag asserts external protection; it does not create a login system. `PDF_STORAGE_DIR=/data/pdfs` is set inside the image, and that directory is not served as static files.

PDFs are stored as private UUID-named files with restrictive permissions. Traversal paths and symlink file reads are rejected. The directory is backed by a Docker volume rather than the image or published frontend folder.

## Operations

```sh
docker compose ps
docker compose logs --tail=100 app
docker compose exec app node -e "fetch('http://127.0.0.1:8080/api/readyz').then(r=>console.log(r.status))"
```

`/api/healthz` checks the process. `/api/readyz` also checks PostgreSQL. Docker waits for database readiness; the app runs versioned migrations before listening and shuts down its connection pool on termination.

After changing code:

```sh
docker compose up --build --detach --wait
```

## Develop without Docker

Use Node 24, pnpm 11.25.0, and a reachable PostgreSQL database. Set `DATABASE_URL` (or `PGHOST`, `PGUSER`, `PGPASSWORD`, and `PGDATABASE`). The Drizzle development CLI expects `DATABASE_URL`.

```sh
pnpm install --frozen-lockfile
pnpm --filter @workspace/db run migrate
pnpm --filter @workspace/api-server run dev
```

In a second terminal:

```sh
pnpm --filter @workspace/boardwork run dev
```

The frontend defaults to port 5173 and proxies `/api` to port 8080. `API_PROXY_TARGET` changes the development proxy. Set an absolute `PDF_STORAGE_DIR` outside the static directory if using private curriculum locally.

For a native production build, run `pnpm run build:app`, set `STATIC_DIR` to the absolute `artifacts/boardwork/dist/public` directory, run the built `dist/migrate.mjs` once, then `pnpm start`.

## Finish leaving the old host

The source is portable; that alone does not stop an already-running deployment or cancel old charges. After confirming the new installation works:

1. Stop/unpublish the old deployment and remove its paid AI integration.
2. Revoke any separately issued owner API key at its provider.
3. Remove old host-specific secrets and cancel unneeded hosting/database/storage subscriptions.

No export is required for the fresh-start option selected for this migration. These account-side shutdown actions have not been performed through GitHub.

## Verification

The GitHub workflow builds the image, initializes a fresh PostgreSQL database, checks SPA and API boundaries, verifies keyless generation is rejected, and creates/reads/deletes a synthetic class without an AI request. It then repeats startup to check migration idempotence. Local API tests use synthetic provider responses and real temporary PDF files.
