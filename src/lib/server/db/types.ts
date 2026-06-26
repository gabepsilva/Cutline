import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type * as schema from './schema';

/** Shared drizzle database handle typed against the full schema. */
export type Database = LibSQLDatabase<typeof schema>;
