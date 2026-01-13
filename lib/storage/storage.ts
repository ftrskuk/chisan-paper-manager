import { randomUUID } from 'crypto'
import {
  uploadToR2,
  generateDownloadUrl,
  deleteFromR2,
  type UploadOptions,
} from './r2-client'

export type StorageProvider = 'r2' | 'supabase'

export const STORAGE_PATHS = {
  TDS_PDFS: 'tds-pdfs',
  SOURCE_PDFS: 'source-pdfs',
} as const

export type StoragePath = (typeof STORAGE_PATHS)[keyof typeof STORAGE_PATHS]

export interface UploadResult {
  key: string
  path: string
}

export function buildStorageKey(
  prefix: StoragePath,
  userId: string,
  filename: string
): string {
  return `${prefix}/${userId}/${filename}`
}

export function sanitizeForFilename(str: string): string {
  const sanitized = str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

  return sanitized || 'unnamed'
}

function generateUniqueId(): string {
  return randomUUID().slice(0, 8)
}

export function generateTimestampedFilename(
  millName: string,
  productName: string,
  extension = 'pdf'
): string {
  const timestamp = Date.now()
  const uniqueId = generateUniqueId()
  const safeMill = sanitizeForFilename(millName)
  const safeProduct = sanitizeForFilename(productName)
  return `${safeMill}_${safeProduct}_${timestamp}_${uniqueId}.${extension}`
}

export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array,
  options: UploadOptions
): Promise<UploadResult> {
  await uploadToR2(key, body, options)
  return { key, path: key }
}

export async function getSignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  return generateDownloadUrl(key, expiresIn)
}

export async function deleteFile(key: string): Promise<void> {
  await deleteFromR2(key)
}

export async function uploadTdsPdf(
  userId: string,
  filename: string,
  buffer: Buffer
): Promise<UploadResult> {
  const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_') || 'document'
  const timestamp = Date.now()
  const uniqueId = generateUniqueId()
  const key = buildStorageKey(
    STORAGE_PATHS.TDS_PDFS,
    userId,
    `${timestamp}_${uniqueId}_${safeName}`
  )

  return uploadFile(key, buffer, { contentType: 'application/pdf' })
}

export async function uploadSourcePdf(
  userId: string,
  millName: string,
  productName: string,
  buffer: Buffer
): Promise<UploadResult> {
  const filename = generateTimestampedFilename(millName, productName)
  const key = buildStorageKey(STORAGE_PATHS.SOURCE_PDFS, userId, filename)

  return uploadFile(key, buffer, { contentType: 'application/pdf' })
}
