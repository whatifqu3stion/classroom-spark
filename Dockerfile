# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS build
ENV CI=true
WORKDIR /workspace
RUN npm install --global pnpm@11.25.0
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build:app
RUN pnpm --filter @workspace/api-server --prod deploy --legacy /runtime/api

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production PORT=8080 STATIC_DIR=/app/public PDF_STORAGE_DIR=/data/pdfs
WORKDIR /app
COPY --from=build --chown=node:node /runtime/api/ ./
COPY --from=build --chown=node:node /workspace/artifacts/boardwork/dist/public/ ./public/
RUN mkdir -p /data/pdfs && chown -R node:node /data
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/api/readyz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "node dist/migrate.mjs && exec node --enable-source-maps dist/index.mjs"]
