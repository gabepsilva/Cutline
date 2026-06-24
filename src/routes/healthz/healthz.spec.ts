import { describe, it, expect } from 'vitest';
import { GET } from './+server';

describe('GET /healthz', () => {
	it('returns 200 with { ok: true }', async () => {
		const res = GET();
		expect(res.status).toBe(200);
		await expect(res.json()).resolves.toEqual({ ok: true });
	});
});
