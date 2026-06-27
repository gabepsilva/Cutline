import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
	cleanupIngestOutputs,
	ffprobeMedia,
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

			const outputs = await runLocalIngestPipeline(sourcePath);
			expect(outputs.waveform.length).toBeGreaterThanOrEqual(
				Math.floor(probe.durationSeconds * outputs.waveform.peaksPerSecond) - 1
			);
			expect(outputs.waveform.data.every((value) => value >= 0 && value <= 1)).toBe(true);
			expect(outputs.filmstripMeta.frameCount).toBeGreaterThan(0);
			expect(outputs.filmstripMeta.cols).toBeGreaterThan(0);
			expect(outputs.filmstripMeta.rows).toBeGreaterThan(0);

			await cleanupIngestOutputs(outputs);
		} finally {
			await rm(workDir, { recursive: true, force: true });
		}
	}, 120_000);
});
