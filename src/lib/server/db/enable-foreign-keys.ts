import type { Client } from '@libsql/client';

/** SQLite/libSQL disable FK enforcement by default — enable per connection. */
export async function enableForeignKeys(client: Client): Promise<void> {
	await client.execute('PRAGMA foreign_keys = ON');
}
