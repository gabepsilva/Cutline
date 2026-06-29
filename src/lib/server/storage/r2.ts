import {
	CompleteMultipartUploadCommand,
	CopyObjectCommand,
	CreateMultipartUploadCommand,
	DeleteObjectsCommand,
	GetObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
	UploadPartCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const PRESIGN_EXPIRY_SECONDS = 3600;

interface R2Config {
	endpoint: string;
	bucket: string;
	publicBucket: string | null;
	publicBaseUrl: string | null;
	accessKeyId: string;
	secretAccessKey: string;
}

let cachedClient: S3Client | null = null;
let cachedConfig: R2Config | null = null;

function readR2Config(): R2Config {
	if (cachedConfig) return cachedConfig;

	const endpoint = process.env.R2_ENDPOINT;
	const bucket = process.env.R2_BUCKET ?? 'cutline-prod';
	const accessKeyId = process.env.R2_ACCESS_KEY_ID;
	const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

	if (!endpoint || !accessKeyId || !secretAccessKey) {
		throw new Error('R2 credentials are not configured');
	}

	cachedConfig = {
		endpoint,
		bucket,
		publicBucket: process.env.R2_PUBLIC_BUCKET ?? null,
		publicBaseUrl: process.env.R2_PUBLIC_BASE_URL ?? null,
		accessKeyId,
		secretAccessKey
	};
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

export function getR2PublicBucket(): string {
	const bucket = readR2Config().publicBucket;
	if (!bucket) {
		throw new Error('R2 public bucket is not configured');
	}
	return bucket;
}

export function getR2PublicBaseUrl(): string {
	const baseUrl = readR2Config().publicBaseUrl;
	if (!baseUrl) {
		throw new Error('R2 public base URL is not configured');
	}
	return baseUrl;
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

export async function presignGetObject(objectKey: string): Promise<string> {
	const client = getR2Client();
	const command = new GetObjectCommand({
		Bucket: getR2Bucket(),
		Key: objectKey
	});
	return getSignedUrl(client, command, { expiresIn: PRESIGN_EXPIRY_SECONDS });
}

export async function getObjectBytes(objectKey: string): Promise<Uint8Array> {
	const client = getR2Client();
	const response = await client.send(
		new GetObjectCommand({
			Bucket: getR2Bucket(),
			Key: objectKey
		})
	);
	if (!response.Body) {
		throw new Error(`R2 object not found: ${objectKey}`);
	}
	return new Uint8Array(await response.Body.transformToByteArray());
}

export async function putObjectBytes(
	objectKey: string,
	body: Uint8Array,
	contentType: string
): Promise<void> {
	const client = getR2Client();
	await client.send(
		new PutObjectCommand({
			Bucket: getR2Bucket(),
			Key: objectKey,
			Body: body,
			ContentType: contentType
		})
	);
}

export async function putObjectJson(objectKey: string, value: unknown): Promise<void> {
	const body = new TextEncoder().encode(JSON.stringify(value));
	await putObjectBytes(objectKey, body, 'application/json');
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

export async function copyObjectToPublicBucket(sourceKey: string, destKey: string): Promise<void> {
	const client = getR2Client();
	const copySource = `${getR2Bucket()}/${sourceKey.split('/').map(encodeURIComponent).join('/')}`;
	await client.send(
		new CopyObjectCommand({
			Bucket: getR2PublicBucket(),
			Key: destKey,
			CopySource: copySource
		})
	);
}

export async function deletePublicObject(objectKey: string): Promise<void> {
	const client = getR2Client();
	await client.send(
		new DeleteObjectsCommand({
			Bucket: getR2PublicBucket(),
			Delete: { Objects: [{ Key: objectKey }] }
		})
	);
}

export function buildPublicUrl(objectKey: string): string {
	return `${getR2PublicBaseUrl().replace(/\/$/, '')}/${objectKey}`;
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
