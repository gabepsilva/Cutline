import { CopyObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-s3', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@aws-sdk/client-s3')>();
	return {
		...actual,
		S3Client: class MockS3Client {
			send = mockSend;
		}
	};
});

import {
	buildPublicUrl,
	copyObjectToPublicBucket,
	deletePublicObject,
	resetR2ClientForTests
} from './r2';

describe('r2 public bucket helpers', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetR2ClientForTests();
		process.env.R2_ENDPOINT = 'https://acct.r2.cloudflarestorage.com';
		process.env.R2_BUCKET = 'cutline-prod';
		process.env.R2_ACCESS_KEY_ID = 'key';
		process.env.R2_SECRET_ACCESS_KEY = 'secret';
		process.env.R2_PUBLIC_BUCKET = 'cutline-public';
		process.env.R2_PUBLIC_BASE_URL = 'https://pub.example.r2.dev/';
		mockSend.mockResolvedValue({});
	});

	it('copyObjectToPublicBucket sends CopyObjectCommand with encoded CopySource', async () => {
		await copyObjectToPublicBucket(
			'users/u/projects/p/media/m/source.mp4',
			'transcription/m/j.mp4'
		);

		expect(mockSend).toHaveBeenCalledTimes(1);
		const command = mockSend.mock.calls[0]![0] as CopyObjectCommand;
		expect(command).toBeInstanceOf(CopyObjectCommand);
		expect(command.input).toMatchObject({
			Bucket: 'cutline-public',
			Key: 'transcription/m/j.mp4',
			CopySource: 'cutline-prod/users/u/projects/p/media/m/source.mp4'
		});
	});

	it('copyObjectToPublicBucket URL-encodes path segments in CopySource', async () => {
		await copyObjectToPublicBucket('users/u/file name.mp4', 'transcription/out.mp4');

		const command = mockSend.mock.calls[0]![0] as CopyObjectCommand;
		expect(command.input.CopySource).toBe('cutline-prod/users/u/file%20name.mp4');
	});

	it('deletePublicObject targets the public bucket', async () => {
		await deletePublicObject('transcription/m/j.mp4');

		expect(mockSend).toHaveBeenCalledTimes(1);
		const command = mockSend.mock.calls[0]![0] as DeleteObjectsCommand;
		expect(command).toBeInstanceOf(DeleteObjectsCommand);
		expect(command.input).toMatchObject({
			Bucket: 'cutline-public',
			Delete: { Objects: [{ Key: 'transcription/m/j.mp4' }] }
		});
	});

	it('buildPublicUrl strips a trailing slash from the base URL', () => {
		expect(buildPublicUrl('transcription/m/j.mp4')).toBe(
			'https://pub.example.r2.dev/transcription/m/j.mp4'
		);
	});

	it('getR2PublicBucket fails fast when unset', async () => {
		delete process.env.R2_PUBLIC_BUCKET;
		resetR2ClientForTests();
		process.env.R2_ENDPOINT = 'https://acct.r2.cloudflarestorage.com';
		process.env.R2_ACCESS_KEY_ID = 'key';
		process.env.R2_SECRET_ACCESS_KEY = 'secret';

		const { getR2PublicBucket } = await import('./r2');
		expect(() => getR2PublicBucket()).toThrow('R2 public bucket is not configured');
	});
});
