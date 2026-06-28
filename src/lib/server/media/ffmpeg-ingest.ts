import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FilmstripMeta } from '$lib/types/ingest-assets';
import { WAVEFORM_PEAKS_PER_SECOND } from '$lib/types/ingest-assets';

export interface FfprobeResult {
	durationSeconds: number;
	width: number;
	height: number;
	hasAudio: boolean;
}

export interface IngestOutputs {
	transcodePath: string;
	filmstripPath: string;
	filmstripMeta: FilmstripMeta;
	waveform: {
		version: number;
		peaksPerSecond: number;
		length: number;
		data: number[];
	};
	probe: FfprobeResult;
}

function runProcess(args: string[]): Promise<{ code: number; stdout: Buffer; stderr: Buffer }> {
	return new Promise((resolve, reject) => {
		const child = spawn(args[0]!, args.slice(1), { stdio: ['ignore', 'pipe', 'pipe'] });
		const stdoutChunks: Buffer[] = [];
		const stderrChunks: Buffer[] = [];
		child.stdout?.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
		child.stderr?.on('data', (chunk: Buffer) => stderrChunks.push(chunk));
		child.on('error', reject);
		child.on('close', (code) => {
			resolve({
				code: code ?? 1,
				stdout: Buffer.concat(stdoutChunks),
				stderr: Buffer.concat(stderrChunks)
			});
		});
	});
}

async function runCommand(args: string[]): Promise<void> {
	const result = await runProcess(args);
	if (result.code !== 0) {
		throw new Error(
			`ffmpeg failed (${result.code}): ${result.stderr.toString('utf8').slice(0, 800)}`
		);
	}
}

async function runCommandOutput(args: string[]): Promise<Uint8Array> {
	const result = await runProcess(args);
	if (result.code !== 0) {
		throw new Error(
			`ffmpeg failed (${result.code}): ${result.stderr.toString('utf8').slice(0, 800)}`
		);
	}
	return new Uint8Array(result.stdout);
}

/** Probe duration and video dimensions from a local media file. */
export async function ffprobeMedia(inputPath: string): Promise<FfprobeResult> {
	const result = await runProcess([
		'ffprobe',
		'-v',
		'quiet',
		'-print_format',
		'json',
		'-show_format',
		'-show_streams',
		inputPath
	]);
	if (result.code !== 0) {
		throw new Error(
			`ffprobe failed (${result.code}): ${result.stderr.toString('utf8').slice(0, 800)}`
		);
	}

	const stdout = result.stdout.toString('utf8');
	const parsed = JSON.parse(stdout) as {
		format?: { duration?: string };
		streams?: { codec_type?: string; width?: number; height?: number }[];
	};
	const durationSeconds = Number.parseFloat(parsed.format?.duration ?? '0');
	const streams = parsed.streams ?? [];
	const videoStream = streams.find((stream) => stream.codec_type === 'video');
	const hasAudio = streams.some((stream) => stream.codec_type === 'audio');
	const width = videoStream?.width ?? 0;
	const height = videoStream?.height ?? 0;

	if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
		throw new Error('Could not determine media duration');
	}
	if (width <= 0 || height <= 0) {
		throw new Error('Could not determine video dimensions');
	}

	return { durationSeconds, width, height, hasAudio };
}

function emptyWaveform() {
	return {
		version: 1 as const,
		peaksPerSecond: WAVEFORM_PEAKS_PER_SECOND,
		length: 0,
		data: [] as number[]
	};
}

function filmstripLayout(durationSeconds: number): {
	intervalSec: number;
	frameCount: number;
	cols: number;
	rows: number;
} {
	const intervalSec = Math.max(1, Math.ceil(durationSeconds / 120));
	const frameCount = Math.max(1, Math.ceil(durationSeconds / intervalSec));
	const cols = Math.max(1, Math.ceil(Math.sqrt(frameCount)));
	const rows = Math.max(1, Math.ceil(frameCount / cols));
	return { intervalSec, frameCount, cols, rows };
}

/** Transcode to faststart H.264/AAC MP4. */
export async function transcodeToMp4(inputPath: string, outputPath: string): Promise<void> {
	await runCommand([
		'ffmpeg',
		'-y',
		'-i',
		inputPath,
		'-c:v',
		'libx264',
		'-profile:v',
		'high',
		'-pix_fmt',
		'yuv420p',
		'-movflags',
		'+faststart',
		'-c:a',
		'aac',
		'-b:a',
		'128k',
		outputPath
	]);
}

/** Build a tiled JPG sprite and metadata for the V1 filmstrip track. */
export async function buildFilmstrip(
	inputPath: string,
	outputPath: string,
	durationSeconds: number,
	sourceWidth: number,
	sourceHeight: number
): Promise<FilmstripMeta> {
	const { intervalSec, frameCount, cols, rows } = filmstripLayout(durationSeconds);
	const frameW = Math.min(160, Math.max(64, Math.round(sourceWidth / 4)));
	const frameH = Math.max(1, Math.round((frameW * sourceHeight) / sourceWidth));

	await runCommand([
		'ffmpeg',
		'-y',
		'-i',
		inputPath,
		'-vf',
		`fps=1/${intervalSec},scale=${frameW}:${frameH},tile=${cols}x${rows}`,
		'-frames:v',
		'1',
		'-q:v',
		'3',
		outputPath
	]);

	return {
		frameCount,
		intervalSec,
		frameW,
		frameH,
		cols,
		rows
	};
}

/** Decode mono PCM and downsample to normalized peak buckets. */
export async function buildWaveformPeaks(
	inputPath: string,
	durationSeconds: number,
	peaksPerSecond = WAVEFORM_PEAKS_PER_SECOND
): Promise<{ version: number; peaksPerSecond: number; length: number; data: number[] }> {
	const sampleRate = 8_000;
	const pcm = await runCommandOutput([
		'ffmpeg',
		'-y',
		'-i',
		inputPath,
		'-ac',
		'1',
		'-ar',
		String(sampleRate),
		'-f',
		'f32le',
		'pipe:1'
	]);

	const sampleCount = Math.floor(pcm.byteLength / 4);
	const samples = new Float32Array(pcm.buffer, pcm.byteOffset, sampleCount);
	const bucketCount = Math.max(1, Math.round(durationSeconds * peaksPerSecond));
	const samplesPerBucket = Math.max(1, Math.floor(sampleCount / bucketCount));
	const data: number[] = [];

	for (let bucket = 0; bucket < bucketCount; bucket++) {
		const start = bucket * samplesPerBucket;
		const end = Math.min(sampleCount, start + samplesPerBucket);
		let peak = 0;
		for (let index = start; index < end; index++) {
			const value = Math.abs(samples[index] ?? 0);
			if (value > peak) peak = value;
		}
		data.push(Math.min(1, peak));
	}

	return {
		version: 1,
		peaksPerSecond,
		length: data.length,
		data
	};
}

/** Full local ingest pipeline — used by the worker and ffmpeg-in-CI tests. */
export async function runLocalIngestPipeline(sourcePath: string): Promise<IngestOutputs> {
	const workDir = await mkdtemp(join(tmpdir(), 'cutline-ingest-'));
	const transcodePath = join(workDir, 'transcode.mp4');
	const filmstripPath = join(workDir, 'filmstrip.jpg');

	try {
		const probe = await ffprobeMedia(sourcePath);
		await transcodeToMp4(sourcePath, transcodePath);
		const filmstripMeta = await buildFilmstrip(
			sourcePath,
			filmstripPath,
			probe.durationSeconds,
			probe.width,
			probe.height
		);
		const waveform = probe.hasAudio
			? await buildWaveformPeaks(sourcePath, probe.durationSeconds)
			: emptyWaveform();

		return {
			transcodePath,
			filmstripPath,
			filmstripMeta,
			waveform,
			probe
		};
	} catch (error) {
		await rm(workDir, { recursive: true, force: true });
		throw error;
	}
}

/** Create a tiny deterministic test video via lavfi (CI fixture generator). */
export async function generateTestVideoFixture(
	outputPath: string,
	{ audio = true }: { audio?: boolean } = {}
): Promise<void> {
	await mkdir(join(outputPath, '..'), { recursive: true }).catch(() => undefined);
	const args = ['ffmpeg', '-y', '-f', 'lavfi', '-i', 'testsrc=duration=2:size=320x240:rate=10'];
	if (audio) {
		args.push('-f', 'lavfi', '-i', 'sine=frequency=440:duration=2');
	}
	args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p');
	if (audio) {
		args.push('-c:a', 'aac', '-shortest');
	} else {
		args.push('-an');
	}
	args.push(outputPath);
	await runCommand(args);
}

export async function readOutputFiles(outputs: IngestOutputs): Promise<{
	transcode: Uint8Array;
	filmstrip: Uint8Array;
}> {
	const [transcode, filmstrip] = await Promise.all([
		readFile(outputs.transcodePath),
		readFile(outputs.filmstripPath)
	]);
	return { transcode: new Uint8Array(transcode), filmstrip: new Uint8Array(filmstrip) };
}

export async function cleanupIngestOutputs(outputs: IngestOutputs): Promise<void> {
	const workDir = join(outputs.transcodePath, '..');
	await rm(workDir, { recursive: true, force: true });
}

/** Write bytes to a temp file for ffmpeg input (worker download step). */
export async function writeTempSourceFile(bytes: Uint8Array, ext = 'mp4'): Promise<string> {
	const workDir = await mkdtemp(join(tmpdir(), 'cutline-source-'));
	const sourcePath = join(workDir, `source.${ext}`);
	await writeFile(sourcePath, bytes);
	return sourcePath;
}

export async function cleanupTempPath(filePath: string): Promise<void> {
	const workDir = join(filePath, '..');
	await rm(workDir, { recursive: true, force: true });
}
