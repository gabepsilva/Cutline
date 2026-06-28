import { describe, expect, it } from 'vitest';
import pino from 'pino';
import { event } from './log';

function capture() {
	const lines: Record<string, unknown>[] = [];
	const log = pino({ level: 'info' }, { write: (s: string) => lines.push(JSON.parse(s)) });
	return { log, lines };
}

describe('event()', () => {
	it('emits a uniform { event, actorId, target, causationId, ...data } line with msg "event"', () => {
		const { log, lines } = capture();
		event(log, 'media.ingested', {
			actorId: 'user-1',
			target: { type: 'media', id: 'm-1' },
			causationId: 'req-1',
			extra: 42
		});
		expect(lines).toHaveLength(1);
		expect(lines[0]).toMatchObject({
			event: 'media.ingested',
			actorId: 'user-1',
			target: { type: 'media', id: 'm-1' },
			causationId: 'req-1',
			extra: 42,
			msg: 'event'
		});
	});
});
