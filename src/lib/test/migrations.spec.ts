import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient, type Client } from '@libsql/client';
import { describe, expect, it } from 'vitest';
import { enableForeignKeys } from '$lib/server/db/enable-foreign-keys';

const MIGRATIONS_DIR = join(process.cwd(), 'drizzle');

function applyMigrationFile(client: Client, filename: string): Promise<void> {
	const sql = readFileSync(join(MIGRATIONS_DIR, filename), 'utf8');
	const statements = sql
		.split('--> statement-breakpoint')
		.map((statement) => statement.trim())
		.filter(Boolean);

	return statements.reduce(
		(chain, statement) => chain.then(() => client.execute(statement).then(() => undefined)),
		Promise.resolve()
	);
}

describe('drizzle migrations', () => {
	it('0003_media_upload_columns succeeds when media already has rows', async () => {
		const client = createClient({ url: ':memory:' });
		try {
			await enableForeignKeys(client);

			for (const file of [
				'0000_bored_gauntlet.sql',
				'0001_domain_schema.sql',
				'0002_job_table.sql'
			]) {
				await applyMigrationFile(client, file);
			}

			await client.execute(`
				INSERT INTO user (id, name, email, email_verified, created_at, updated_at)
				VALUES ('user-a', 'Alex', 'alex@cutline.test', 1, 1, 1)
			`);
			await client.execute(`
				INSERT INTO project (
					id, user_id, title, kind, duration_seconds, thumb, created_at, updated_at
				) VALUES ('proj-1', 'user-a', 'Demo', 'TALKING HEAD', 0, 'thumb', 1, 1)
			`);
			await client.execute(`
				INSERT INTO media (
					id, project_id, name, duration_seconds, kind, thumb, size_bytes
				) VALUES ('media-1', 'proj-1', 'clip.mp4', 10, 'B-roll', 'thumb', 1024)
			`);

			await expect(
				applyMigrationFile(client, '0003_media_upload_columns.sql')
			).resolves.toBeUndefined();

			const row = (await client.execute('SELECT * FROM media WHERE id = ?', ['media-1']))
				.rows[0] as Record<string, unknown> | undefined;

			expect(row).toBeDefined();
			expect(row?.status).toBe('ready');
			expect(row?.created_at).toEqual(expect.any(Number));
			expect(row?.object_key).toBeNull();
		} finally {
			client.close();
		}
	});
});
