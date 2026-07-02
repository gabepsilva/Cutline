import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
	cleanupIngestOutputs,
	ffprobeMedia,
	generateAudioOnlyTestFixture,
	generateMultiAudioTestVideoFixture,
	generateTestVideoFixture,
	runLocalIngestPipeline
} from '$lib/server/media/ffmpeg-ingest';

const ffmpegAvailable = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;

describe.runIf(ffmpegAvailable)('ffmpeg ingest pipeline', () => {
	it('probes, transcodes, builds filmstrip and waveform from a fixture', async () => {
		const workDir = await mkdtemp(join(tmpdir(), 'cutline-fixture-'));
		const sourcePath = join(workDir, 'fixture.mp4');

		try {
			await generateTestVideoFixture(sourcePath);
			const probe = await ffprobeMedia(sourcePath);
			expect(probe.durationSeconds).toBeGreaterThan(1.5);
			expect(probe.width).toBe(320);
			expect(probe.height).toBe(240);
			expect(probe.hasAudio).toBe(true);
			expect(probe.hasVideo).toBe(true);

			const outputs = await runLocalIngestPipeline(sourcePath);
			expect(outputs.waveform.length).toBeGreaterThanOrEqual(
				Math.floor(probe.durationSeconds * outputs.waveform.peaksPerSecond) - 1
			);
			expect(outputs.waveform.data.every((value) => value >= 0 && value <= 1)).toBe(true);
			expect(outputs.filmstripMeta?.frameCount).toBeGreaterThan(0);
			expect(outputs.filmstripMeta?.cols).toBeGreaterThan(0);
			expect(outputs.filmstripMeta?.rows).toBeGreaterThan(0);

			await cleanupIngestOutputs(outputs);
		} finally {
			await rm(workDir, { recursive: true, force: true });
		}
	}, 120_000);

	it('ingests silent video with an empty waveform', async () => {
		const workDir = await mkdtemp(join(tmpdir(), 'cutline-fixture-'));
		const sourcePath = join(workDir, 'silent-fixture.mp4');

		try {
			await generateTestVideoFixture(sourcePath, { audio: false });
			const probe = await ffprobeMedia(sourcePath);
			expect(probe.hasAudio).toBe(false);
			expect(probe.hasVideo).toBe(true);

			const outputs = await runLocalIngestPipeline(sourcePath);
			expect(outputs.waveform.length).toBe(0);
			expect(outputs.waveform.data).toEqual([]);
			expect(outputs.filmstripMeta?.frameCount).toBeGreaterThan(0);

			await cleanupIngestOutputs(outputs);
		} finally {
			await rm(workDir, { recursive: true, force: true });
		}
	}, 120_000);

	it('ingests audio-only media with a waveform and no filmstrip', async () => {
		const workDir = await mkdtemp(join(tmpdir(), 'cutline-fixture-'));
		const sourcePath = join(workDir, 'audio-fixture.mp3');

		try {
			await generateAudioOnlyTestFixture(sourcePath);
			const probe = await ffprobeMedia(sourcePath);
			expect(probe.hasAudio).toBe(true);
			expect(probe.hasVideo).toBe(false);
			expect(probe.width).toBeNull();
			expect(probe.height).toBeNull();

			const outputs = await runLocalIngestPipeline(sourcePath);
			expect(outputs.filmstripMeta).toBeNull();
			expect(outputs.filmstripPath).toBeNull();
			expect(outputs.waveform.length).toBeGreaterThanOrEqual(
				Math.floor(probe.durationSeconds * outputs.waveform.peaksPerSecond) - 1
			);

			await cleanupIngestOutputs(outputs);
		} finally {
			await rm(workDir, { recursive: true, force: true });
		}
	}, 120_000);

	it('ingests multi-audio video and builds waveform from the first audio track (#188)', async () => {
		const workDir = await mkdtemp(join(tmpdir(), 'cutline-fixture-'));
		const sourcePath = join(workDir, 'multi-audio-fixture.mp4');

		try {
			await generateMultiAudioTestVideoFixture(sourcePath);

			const probeJson = spawnSync(
				'ffprobe',
				['-v', 'quiet', '-print_format', 'json', '-show_streams', sourcePath],
				{ encoding: 'utf8' }
			);
			expect(probeJson.status).toBe(0);
			const streams = (JSON.parse(probeJson.stdout) as { streams?: { codec_type?: string }[] })
				.streams;
			expect(streams?.filter((stream) => stream.codec_type === 'audio')).toHaveLength(2);

			const probe = await ffprobeMedia(sourcePath);
			expect(probe.hasAudio).toBe(true);
			expect(probe.hasVideo).toBe(true);

			const outputs = await runLocalIngestPipeline(sourcePath);
			expect(outputs.waveform.length).toBeGreaterThanOrEqual(
				Math.floor(probe.durationSeconds * outputs.waveform.peaksPerSecond) - 1
			);
			expect(outputs.waveform.data.every((value) => value >= 0 && value <= 1)).toBe(true);
			expect(outputs.waveform.data.some((value) => value > 0)).toBe(true);
			expect(outputs.filmstripMeta?.frameCount).toBeGreaterThan(0);

			const transcode = await readFile(outputs.transcodePath);
			expect(transcode.byteLength).toBeGreaterThan(0);

			await cleanupIngestOutputs(outputs);
		} finally {
			await rm(workDir, { recursive: true, force: true });
		}
	}, 120_000);
});
