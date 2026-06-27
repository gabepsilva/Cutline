import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	pollTranscriptionJob,
	resolveTranscriptUiStatus,
	toTranscriptionUiState
} from '$lib/editor/transcription-status';
import { formatTranscriptionPercent, transcriptionStage } from '$lib/types/transcript-ui';

describe('transcript-ui helpers', () => {
	it('formats transcription percent', () => {
		expect(formatTranscriptionPercent(0.456)).toBe('46%');
		expect(formatTranscriptionPercent(1.2)).toBe('100%');
	});

	it('returns stage labels by progress band', () => {
		expect(transcriptionStage(0.1)).toBe('Detecting speech…');
		expect(transcriptionStage(0.5)).toBe('Generating transcript…');
		expect(transcriptionStage(0.9)).toBe('Aligning words to timeline…');
	});
});

describe('transcription-status', () => {
	it('returns ready when words exist', () => {
		expect(
			resolveTranscriptUiStatus({
				wordCount: 3,
				aRoll: null,
				jobStatus: null
			})
		).toBe('ready');
	});

	it('returns transcribing for active jobs', () => {
		expect(
			resolveTranscriptUiStatus({
				wordCount: 0,
				aRoll: { mediaId: 'm1', status: 'ready', videoUrl: null },
				jobStatus: { status: 'running', progress: 0.4 }
			})
		).toBe('transcribing');
	});

	it('returns unavailable for failed or canceled terminal jobs', () => {
		expect(
			resolveTranscriptUiStatus({
				wordCount: 0,
				aRoll: { mediaId: 'm1', status: 'ready', videoUrl: null },
				jobStatus: { status: 'failed', progress: 0 }
			})
		).toBe('unavailable');

		expect(
			resolveTranscriptUiStatus({
				wordCount: 0,
				aRoll: { mediaId: 'm1', status: 'ready', videoUrl: null },
				jobStatus: { status: 'canceled', progress: 0 }
			})
		).toBe('unavailable');
	});

	it('returns unavailable when a prior job failed and none is active (reload)', () => {
		expect(
			resolveTranscriptUiStatus({
				wordCount: 0,
				aRoll: { mediaId: 'm1', status: 'ready', videoUrl: null },
				jobStatus: null,
				failed: true
			})
		).toBe('unavailable');
	});

	it('returns unavailable when no A-roll path exists', () => {
		expect(
			resolveTranscriptUiStatus({
				wordCount: 0,
				aRoll: null,
				jobStatus: { status: 'failed', progress: 0 }
			})
		).toBe('unavailable');
	});

	it('maps ui state with stage text', () => {
		expect(toTranscriptionUiState('transcribing', 0.5)).toEqual({
			status: 'transcribing',
			progress: 0.5,
			stage: 'Generating transcript…'
		});
	});
});

describe('pollTranscriptionJob', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it('polls until the job reaches a terminal status', async () => {
		const onUpdate = vi.fn();
		const onTerminal = vi.fn();
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ status: 'running', progress: 0.4 }), { status: 200 })
			)
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ status: 'succeeded', progress: 1 }), { status: 200 })
			);
		vi.stubGlobal('fetch', fetchMock);

		pollTranscriptionJob('job-1', onUpdate, onTerminal, 100);

		await vi.advanceTimersByTimeAsync(0);
		expect(onUpdate).toHaveBeenCalledWith({ status: 'running', progress: 0.4 });

		await vi.advanceTimersByTimeAsync(100);
		expect(onTerminal).toHaveBeenCalledWith({ status: 'succeeded', progress: 1 });
	});
});
