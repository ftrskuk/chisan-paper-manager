import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

let r2Client: S3Client | null = null

function getR2Client(): S3Client {
  if (!r2Client) {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${getRequiredEnv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: getRequiredEnv('R2_ACCESS_KEY_ID'),
        secretAccessKey: getRequiredEnv('R2_SECRET_ACCESS_KEY'),
      },
    })
  }
  return r2Client
}

function getBucketName(): string {
  return getRequiredEnv('R2_BUCKET_NAME')
}

export class InvalidStorageKeyError extends Error {
  constructor(key: string, reason: string) {
    super(`Invalid storage key "${key}": ${reason}`)
    this.name = 'InvalidStorageKeyError'
  }
}

export function assertValidKey(key: string): void {
  if (!key || key.trim() === '') {
    throw new InvalidStorageKeyError(key, 'key cannot be empty')
  }
  if (key.startsWith('/')) {
    throw new InvalidStorageKeyError(key, 'key cannot start with /')
  }
  if (key.includes('..')) {
    throw new InvalidStorageKeyError(key, 'key cannot contain ..')
  }
  if (key.includes('//')) {
    throw new InvalidStorageKeyError(key, 'key cannot contain //')
  }
  if (key.length > 1024) {
    throw new InvalidStorageKeyError(key, 'key exceeds maximum length of 1024')
  }
}

export interface UploadOptions {
  contentType: string
  metadata?: Record<string, string>
}

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  options: UploadOptions
): Promise<void> {
  assertValidKey(key)
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: body,
    ContentType: options.contentType,
    Metadata: options.metadata,
  })

  await getR2Client().send(command)
}

export async function generateUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 600
): Promise<string> {
  assertValidKey(key)
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(getR2Client(), command, { expiresIn })
}

export async function generateDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  assertValidKey(key)
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  })

  return getSignedUrl(getR2Client(), command, { expiresIn })
}

export async function deleteFromR2(key: string): Promise<void> {
  assertValidKey(key)
  const command = new DeleteObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  })

  await getR2Client().send(command)
}

export async function getPublicOrSignedUrl(key: string): Promise<string> {
  assertValidKey(key)
  const publicUrl = process.env.R2_PUBLIC_URL
  if (publicUrl) {
    return `${publicUrl}/${encodeURIComponent(key)}`
  }
  return generateDownloadUrl(key)
}
