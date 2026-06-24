// Apply drizzle SQL migrations at container startup (T-10). Non-interactive,
// uses only production deps (drizzle-orm + @libsql/client) — unlike `drizzle-kit
// push`, which needs a TTY. Idempotent: drizzle tracks applied migrations in the
// __drizzle_migrations table, so re-running on an existing DB is a no-op.
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { migrate } from 'drizzle-orm/libsql/migrator';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const client = createClient({ url });
const db = drizzle(client);

await migrate(db, { migrationsFolder: 'drizzle' });
console.log(`[migrate] schema up to date (${url})`);
client.close();
