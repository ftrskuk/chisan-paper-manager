# R2 Integration Reference for import-hub-chisan

> Reference implementation from chisan-paper-manager (2026-01-13)

---

## Quick Start

### 1. Install Dependencies

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install -D dotenv tsx
```

### 2. Environment Variables

Add to `.env.local`:

```env
R2_ACCOUNT_ID=90197736...
R2_ACCESS_KEY_ID=f94cc1c0...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=chisan-files
R2_PUBLIC_URL=https://files.your-domain.com  # optional
```

### 3. Copy These Files

From `chisan-paper-manager`:

| Source                     | Copy To                    | Adapt                       |
| -------------------------- | -------------------------- | --------------------------- |
| `lib/storage/r2-client.ts` | `lib/storage/r2-client.ts` | No changes needed           |
| `lib/storage/storage.ts`   | `lib/storage/storage.ts`   | Update paths for import-hub |

---

## R2 Client (Copy As-Is)

**File: `lib/storage/r2-client.ts`**

```typescript
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
```

---

## Storage Layer (Adapt for Import Hub)

**File: `lib/storage/storage.ts`**

```typescript
import { randomUUID } from 'crypto'
import {
  uploadToR2,
  generateDownloadUrl,
  deleteFromR2,
  type UploadOptions,
} from './r2-client'

export const STORAGE_PATHS = {
  SHIPPING_DOCS: 'shipping-docs',
  CONTRACTS: 'contracts',
  CUSTOMS: 'customs',
  INVOICES: 'invoices',
} as const

export type StoragePath = (typeof STORAGE_PATHS)[keyof typeof STORAGE_PATHS]

export interface UploadResult {
  key: string
  path: string
}

function generateUniqueId(): string {
  return randomUUID().slice(0, 8)
}

export function buildStorageKey(
  prefix: StoragePath,
  orderId: string,
  filename: string
): string {
  return `${prefix}/${orderId}/${filename}`
}

export function sanitizeForFilename(str: string): string {
  const sanitized = str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  return sanitized || 'unnamed'
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

export async function uploadShippingDoc(
  orderId: string,
  docType: string,
  filename: string,
  buffer: Buffer
): Promise<UploadResult> {
  const timestamp = Date.now()
  const uniqueId = generateUniqueId()
  const safeType = sanitizeForFilename(docType)
  const key = buildStorageKey(
    STORAGE_PATHS.SHIPPING_DOCS,
    orderId,
    `${safeType}_${timestamp}_${uniqueId}.pdf`
  )
  return uploadFile(key, buffer, { contentType: 'application/pdf' })
}

export async function uploadContract(
  orderId: string,
  filename: string,
  buffer: Buffer
): Promise<UploadResult> {
  const timestamp = Date.now()
  const uniqueId = generateUniqueId()
  const key = buildStorageKey(
    STORAGE_PATHS.CONTRACTS,
    orderId,
    `contract_${timestamp}_${uniqueId}.pdf`
  )
  return uploadFile(key, buffer, { contentType: 'application/pdf' })
}

export async function uploadCustomsDoc(
  orderId: string,
  docType: string,
  filename: string,
  buffer: Buffer
): Promise<UploadResult> {
  const timestamp = Date.now()
  const uniqueId = generateUniqueId()
  const safeType = sanitizeForFilename(docType)
  const key = buildStorageKey(
    STORAGE_PATHS.CUSTOMS,
    orderId,
    `${safeType}_${timestamp}_${uniqueId}.pdf`
  )
  return uploadFile(key, buffer, { contentType: 'application/pdf' })
}
```

---

## R2 Folder Structure

```
chisan-files/
├── tds-pdfs/                    # Paper Manager (existing)
│   └── {user_id}/
│       └── {timestamp}_{uuid}_{filename}.pdf
│
├── source-pdfs/                 # Paper Manager (existing)
│   └── {user_id}/
│       └── {mill}_{product}_{timestamp}_{uuid}.pdf
│
├── shipping-docs/               # Import Hub (new)
│   └── {order_id}/
│       └── {doc_type}_{timestamp}_{uuid}.pdf
│
├── contracts/                   # Import Hub (new)
│   └── {order_id}/
│       └── contract_{timestamp}_{uuid}.pdf
│
└── customs/                     # Import Hub (new)
    └── {order_id}/
        └── {doc_type}_{timestamp}_{uuid}.pdf
```

---

## Server Action Example

**File: `lib/actions/document-upload.ts`**

```typescript
'use server'

import { requireAuth, getUser } from '@/lib/auth'
import {
  uploadShippingDoc,
  getSignedDownloadUrl,
  deleteFile,
} from '@/lib/storage/storage'

const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function uploadDocument(
  formData: FormData,
  orderId: string,
  docType: string
): Promise<{ path: string; filename: string }> {
  await requireAuth()
  const user = await getUser()
  if (!user) throw new Error('Not authenticated')

  const file = formData.get('file') as File
  if (!file) throw new Error('No file provided')
  if (file.type !== 'application/pdf') throw new Error('Only PDF allowed')
  if (file.size > MAX_FILE_SIZE) throw new Error('File too large (max 10MB)')

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const result = await uploadShippingDoc(orderId, docType, file.name, buffer)
  return { path: result.key, filename: file.name }
}

export async function getDocumentUrl(path: string): Promise<string> {
  return getSignedDownloadUrl(path, 3600)
}

export async function deleteDocument(path: string): Promise<void> {
  await requireAuth()
  await deleteFile(path)
}
```

---

## Testing Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "r2:test": "tsx scripts/test-r2-connection.ts",
    "r2:test:upload": "tsx scripts/test-document-upload.ts"
  }
}
```

Copy and adapt test scripts from `chisan-paper-manager/scripts/`.

---

## Document Types for Import Hub

```typescript
export const DOCUMENT_TYPES = {
  BL: 'bill_of_lading',
  CI: 'commercial_invoice',
  PL: 'packing_list',
  CO: 'certificate_of_origin',
  LC: 'letter_of_credit',
  CUSTOMS: 'customs_declaration',
  DELIVERY: 'delivery_order',
} as const
```

---

## Database Schema Update

Store R2 paths in documents table:

```sql
ALTER TABLE documents
ADD COLUMN storage_path TEXT,
ADD COLUMN storage_provider TEXT DEFAULT 'r2';
```

---

## Checklist for import-hub-chisan

- [ ] Copy `lib/storage/r2-client.ts`
- [ ] Create `lib/storage/storage.ts` with import-hub paths
- [ ] Add R2 env vars to `.env.local`
- [ ] Create document upload action
- [ ] Update documents table schema
- [ ] Add test scripts
- [ ] Test upload/download flow

---

## R2 Credentials (Shared)

Same credentials work for both projects since they share `chisan-files` bucket.

| Variable             | Value                   |
| -------------------- | ----------------------- |
| R2_ACCOUNT_ID        | (same as paper-manager) |
| R2_ACCESS_KEY_ID     | (same as paper-manager) |
| R2_SECRET_ACCESS_KEY | (same as paper-manager) |
| R2_BUCKET_NAME       | chisan-files            |

---

_Reference: chisan-paper-manager @ commit 80074da + R2 integration_
