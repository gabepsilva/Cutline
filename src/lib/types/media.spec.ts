import { describe, expect, it } from 'vitest';
import {
	createRecordingResource,
	formatMediaDuration,
	isMediaKind,
	MEDIA_KINDS,
	recordingThumb
} from './media';

describe('media domain', () => {
	describe('formatMediaDuration', () => {
		it.each([
			{ seconds: 0, expected: '0:00' },
			{ seconds: 65, expected: '1:05' },
			{ seconds: 272, expected: '4:32' }
		])('formats $seconds as $expected', ({ seconds, expected }) => {
			expect(formatMediaDuration(seconds)).toBe(expected);
		});

		it('treats non-finite input as zero', () => {
			expect(formatMediaDuration(Number.NaN)).toBe('0:00');
		});
	});

	describe('isMediaKind', () => {
		it.each(MEDIA_KINDS)('accepts known kind %s', (kind) => {
			expect(isMediaKind(kind)).toBe(true);
		});

		it('rejects unknown kinds', () => {
			expect(isMediaKind('Podcast')).toBe(false);
		});
	});

	describe('recordingThumb', () => {
		it('returns a CSS background value', () => {
			expect(recordingThumb()).toContain('repeating-linear-gradient');
		});
	});

	describe('createRecordingResource', () => {
		it('builds a recording resource with rounded duration', () => {
			const resource = createRecordingResource(2, 4.2);
			expect(resource).toMatchObject({
				id: 'rec-2',
				name: 'Recording 2',
				dur: 4,
				kind: 'Recording',
				thumb: recordingThumb()
			});
		});

		it('enforces a one-second minimum duration', () => {
			expect(createRecordingResource(1, 0.2).dur).toBe(1);
		});
	});
});
