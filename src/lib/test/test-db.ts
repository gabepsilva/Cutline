import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { enableForeignKeys } from '$lib/server/db/enable-foreign-keys';
import * as schema from '$lib/server/db/schema';

export type TestDatabase = LibSQLDatabase<typeof schema>;

/** In-memory libSQL database with migrations applied — for server unit tests. */
export async function createTestDb(): Promise<{ db: TestDatabase; client: Client }> {
	const client = createClient({ url: ':memory:' });
	await enableForeignKeys(client);
	const db = drizzle(client, { schema });
	await migrate(db, { migrationsFolder: 'drizzle' });
	return { db, client };
}
