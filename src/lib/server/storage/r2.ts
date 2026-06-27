import {
	CompleteMultipartUploadCommand,
	CreateMultipartUploadCommand,
	DeleteObjectsCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
	UploadPartCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '$env/dynamic/private';

const PRESIGN_EXPIRY_SECONDS = 3600;

interface R2Config {
	endpoint: string;
	bucket: string;
	accessKeyId: string;
	secretAccessKey: string;
}

let cachedClient: S3Client | null = null;
let cachedConfig: R2Config | null = null;

function readR2Config(): R2Config {
	if (cachedConfig) return cachedConfig;

	const endpoint = env.R2_ENDPOINT;
	const bucket = env.R2_BUCKET ?? 'cutline-prod';
	const accessKeyId = env.R2_ACCESS_KEY_ID;
	const secretAccessKey = env.R2_SECRET_ACCESS_KEY;

	if (!endpoint || !accessKeyId || !secretAccessKey) {
		throw new Error('R2 credentials are not configured');
	}

	cachedConfig = { endpoint, bucket, accessKeyId, secretAccessKey };
	return cachedConfig;
}

/** Resets cached client/config — for unit tests only. */
export function resetR2ClientForTests(): void {
	cachedClient = null;
	cachedConfig = null;
}

export function getR2Bucket(): string {
	return readR2Config().bucket;
}

export function getR2Client(): S3Client {
	if (cachedClient) return cachedClient;

	const { endpoint, accessKeyId, secretAccessKey } = readR2Config();
	cachedClient = new S3Client({
		region: 'auto',
		endpoint,
		credentials: { accessKeyId, secretAccessKey },
		forcePathStyle: true
	});
	return cachedClient;
}

export async function presignPutObject(objectKey: string, contentType: string): Promise<string> {
	const client = getR2Client();
	const command = new PutObjectCommand({
		Bucket: getR2Bucket(),
		Key: objectKey,
		ContentType: contentType
	});
	return getSignedUrl(client, command, {
		expiresIn: PRESIGN_EXPIRY_SECONDS,
		unhoistableHeaders: new Set(['content-type'])
	});
}

export async function createMultipartUpload(
	objectKey: string,
	contentType: string
): Promise<string> {
	const client = getR2Client();
	const response = await client.send(
		new CreateMultipartUploadCommand({
			Bucket: getR2Bucket(),
			Key: objectKey,
			ContentType: contentType
		})
	);
	if (!response.UploadId) {
		throw new Error('R2 did not return an upload ID');
	}
	return response.UploadId;
}

export async function presignUploadPart(
	objectKey: string,
	uploadId: string,
	partNumber: number
): Promise<string> {
	const client = getR2Client();
	const command = new UploadPartCommand({
		Bucket: getR2Bucket(),
		Key: objectKey,
		UploadId: uploadId,
		PartNumber: partNumber
	});
	return getSignedUrl(client, command, { expiresIn: PRESIGN_EXPIRY_SECONDS });
}

export async function completeMultipartUpload(
	objectKey: string,
	uploadId: string,
	parts: { partNumber: number; etag: string }[]
): Promise<void> {
	const client = getR2Client();
	await client.send(
		new CompleteMultipartUploadCommand({
			Bucket: getR2Bucket(),
			Key: objectKey,
			UploadId: uploadId,
			MultipartUpload: {
				Parts: parts
					.slice()
					.sort((a, b) => a.partNumber - b.partNumber)
					.map((part) => ({
						PartNumber: part.partNumber,
						ETag: part.etag
					}))
			}
		})
	);
}

export async function deleteObject(objectKey: string): Promise<void> {
	const client = getR2Client();
	await client.send(
		new DeleteObjectsCommand({
			Bucket: getR2Bucket(),
			Delete: { Objects: [{ Key: objectKey }] }
		})
	);
}

/** Deletes every object under a prefix (used for project/media cleanup). */
export async function deletePrefix(prefix: string): Promise<void> {
	const client = getR2Client();
	const bucket = getR2Bucket();
	let continuationToken: string | undefined;

	do {
		const listing = await client.send(
			new ListObjectsV2Command({
				Bucket: bucket,
				Prefix: prefix,
				ContinuationToken: continuationToken
			})
		);

		const keys = (listing.Contents ?? [])
			.map((item) => item.Key)
			.filter((key): key is string => Boolean(key));

		if (keys.length > 0) {
			await client.send(
				new DeleteObjectsCommand({
					Bucket: bucket,
					Delete: { Objects: keys.map((Key) => ({ Key })) }
				})
			);
		}

		continuationToken = listing.IsTruncated ? listing.NextContinuationToken : undefined;
	} while (continuationToken);
}
