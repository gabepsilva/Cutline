# syntax=docker/dockerfile:1.23@sha256:2780b5c3bab67f1f76c781860de469442999ed1a0d7992a5efdf2cffc0e3d769
#
# Cutline production image (T-10). SvelteKit SSR via @sveltejs/adapter-node, run
# with bun. Build from repo root:
#   docker build -t cutline:local .
#
# Pinned digests — bump tag + digest together when upgrading.
# oven/bun:1.3.13 (debian) — build stages; oven/bun:1.3.13-alpine — runtime, for a
#   minimal low-CVE image. @libsql/client ships both gnu and musl prebuilt bindings,
#   so the musl one loads on alpine. esbuild/tsx (build-only, transitive) are stripped
#   from the runtime image — they carry Go-stdlib CVEs and are never run at runtime.

# --- install all deps (incl. dev) for the build ---
FROM oven/bun:1.3.13@sha256:87416c977a612a204eb54ab9f3927023c2a3c971f4f345a01da08ea6262ae30e AS deps
WORKDIR /app
COPY package.json bun.lock ./
# --ignore-scripts: skip better-sqlite3's node-gyp build (transitive drizzle-kit dep
# we don't use — we use @libsql/client, which ships prebuilt binaries). SvelteKit's
# sync runs during `vite build`, so the skipped `prepare` script is not needed.
RUN bun install --frozen-lockfile --ignore-scripts

# --- build the SvelteKit server (adapter-node -> /app/build) ---
FROM oven/bun:1.3.13@sha256:87416c977a612a204eb54ab9f3927023c2a3c971f4f345a01da08ea6262ae30e AS build
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# DATABASE_URL and BETTER_AUTH_SECRET are read at import time when SvelteKit analyses
# server modules during the build. Throwaway build-only values — the real secret and
# database come from the Kubernetes ConfigMap/Secret at runtime.
RUN DATABASE_URL="file:/tmp/build.db" \
    BETTER_AUTH_SECRET="build-time-placeholder-not-used-at-runtime-000" \
    bun run build

# --- production-only deps (alpine/musl, to match the runtime base) ---
FROM oven/bun:1.3.13-alpine@sha256:4de475389889577f346c636f956b42a5c31501b654664e9ae5726f94d7bb5349 AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production --ignore-scripts
# Strip build-only tooling that leaks into the prod tree (never used at runtime —
# the server is pre-built and migrate.mjs only needs drizzle-orm + @libsql/client).
RUN rm -rf node_modules/esbuild node_modules/@esbuild node_modules/@esbuild-kit \
           node_modules/tsx node_modules/.bin/esbuild node_modules/.bin/tsx

# --- slim runtime (alpine) ---
FROM oven/bun:1.3.13-alpine@sha256:4de475389889577f346c636f956b42a5c31501b654664e9ae5726f94d7bb5349 AS runner
WORKDIR /app
# Pull patched OS packages (e.g. openssl) released after the base image was cut,
# so the image scan stays clean without waiting for a base-image bump.
RUN apk upgrade --no-cache
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    HOME=/tmp
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY drizzle ./drizzle
COPY scripts/migrate.mjs ./scripts/migrate.mjs
COPY docker-entrypoint.sh ./docker-entrypoint.sh
COPY package.json ./package.json
RUN chmod +x /app/docker-entrypoint.sh

# oven/bun ships an unprivileged `bun` user (uid/gid 1000).
USER bun
EXPOSE 3000
STOPSIGNAL SIGTERM
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["/app/docker-entrypoint.sh"]
