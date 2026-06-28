#!/usr/bin/env bun
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../src/lib/server/db/schema.ts';
import { enableForeignKeys } from '../src/lib/server/db/enable-foreign-keys.ts';
import { runWorkerLoop } from '../src/lib/server/jobs/worker.ts';
import { registerIngestHandler } from '../src/lib/server/jobs/handlers/ingest.ts';
import { logger } from '../src/lib/server/log.ts';

const url = process.env.DATABASE_URL;
if (!url) {
	logger.error('DATABASE_URL is required');
	process.exit(1);
}

const client = createClient({
	url,
	...(process.env.DATABASE_AUTH_TOKEN ? { authToken: process.env.DATABASE_AUTH_TOKEN } : {})
});
await enableForeignKeys(client);

const db = drizzle(client, { schema });
const workerId = process.env.WORKER_ID ?? `worker-${process.pid}`;
registerIngestHandler(db);
const abort = new AbortController();

process.on('SIGINT', () => abort.abort());
process.on('SIGTERM', () => abort.abort());

logger.info({ workerId }, 'job worker started');
await runWorkerLoop(db, workerId, { signal: abort.signal, pollIntervalMs: 1_000 });
