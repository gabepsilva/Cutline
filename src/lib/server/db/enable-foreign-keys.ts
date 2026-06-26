import type { Client } from '@libsql/client';

/**
 * SQLite/libSQL disable FK enforcement by default — enable per connection.
 *
 * Reliable for a persistent `file:` connection (local dev / CI), where this client keeps a
 * single connection for its lifetime. Over remote Turso (libSQL HTTP, a stream per request)
 * this one-shot pragma is best-effort and may not cover later queries — so runtime
 * cascade/restrict enforcement on Turso must be verified, and the durable mechanism for it
 * is owned by #133 (delete features), not assumed here. Harmless either way; migrations are
 * unaffected (DDL needs no FK enforcement).
 */
export async function enableForeignKeys(client: Client): Promise<void> {
	await client.execute('PRAGMA foreign_keys = ON');
}
