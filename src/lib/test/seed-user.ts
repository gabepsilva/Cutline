import { user } from '$lib/server/db/auth.schema';
import type { TestDatabase } from '$lib/test/test-db';

/** Inserts a minimal verified auth user for server unit tests. */
export async function seedUser(db: TestDatabase, seed: { id: string; email: string }) {
	await db.insert(user).values({
		id: seed.id,
		name: 'Test User',
		email: seed.email,
		emailVerified: true,
		createdAt: new Date('2026-06-01T00:00:00.000Z'),
		updatedAt: new Date('2026-06-01T00:00:00.000Z')
	});
}
