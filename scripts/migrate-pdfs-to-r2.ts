/**
 * Migration: Supabase Storage -> Cloudflare R2
 * Run: npx tsx scripts/migrate-pdfs-to-r2.ts [--dry-run]
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnySupabaseClient = ReturnType<typeof createSupabaseClient<any>>
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'

const DRY_RUN = process.argv.includes('--dry-run')

interface ProductWithPdf {
  id: string
  mill_name: string
  name: string
  file_url: string | null
  source_pdf_path: string | null
  created_by: string | null
}

interface MigrationResult {
  productId: string
  field: 'file_url' | 'source_pdf_path'
  oldPath: string
  newPath: string
  success: boolean
  error?: string
}

function createR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

function isSupabaseStoragePath(path: string | null): boolean {
  if (!path) return false
  return (
    path.startsWith('spec-sheets/') ||
    path.includes('supabase') ||
    (!path.startsWith('tds-pdfs/') && !path.startsWith('source-pdfs/'))
  )
}

function buildR2Key(
  type: 'tds-pdfs' | 'source-pdfs',
  userId: string,
  filename: string
): string {
  return `${type}/${userId}/${filename}`
}

function extractFilename(path: string): string {
  const parts = path.split('/')
  return parts[parts.length - 1] || `migrated_${Date.now()}.pdf`
}

async function checkR2ObjectExists(
  r2: S3Client,
  key: string
): Promise<boolean> {
  try {
    await r2.send(
      new HeadObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      })
    )
    return true
  } catch {
    return false
  }
}

async function migrateFile(
  supabase: AnySupabaseClient,
  r2: S3Client,
  product: ProductWithPdf,
  field: 'file_url' | 'source_pdf_path',
  oldPath: string
): Promise<MigrationResult> {
  const type = field === 'file_url' ? 'tds-pdfs' : 'source-pdfs'
  const userId = product.created_by || 'unknown'
  const filename = extractFilename(oldPath)
  const newKey = buildR2Key(type, userId, filename)

  const result: MigrationResult = {
    productId: product.id,
    field,
    oldPath,
    newPath: newKey,
    success: false,
  }

  try {
    const exists = await checkR2ObjectExists(r2, newKey)
    if (exists) {
      console.log(`  [SKIP] Already exists in R2: ${newKey}`)
      result.success = true
      return result
    }

    const storagePath = oldPath.replace(/^spec-sheets\//, '')
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('spec-sheets')
      .download(storagePath)

    if (downloadError || !fileData) {
      result.error = `Download failed: ${downloadError?.message || 'No data'}`
      return result
    }

    if (DRY_RUN) {
      console.log(
        `  [DRY-RUN] Would upload ${fileData.size} bytes to ${newKey}`
      )
      result.success = true
      return result
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: newKey,
        Body: buffer,
        ContentType: 'application/pdf',
      })
    )

    const updateData =
      field === 'file_url' ? { file_url: newKey } : { source_pdf_path: newKey }
    const { error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', product.id)

    if (updateError) {
      result.error = `DB update failed: ${updateError.message}`
      return result
    }

    result.success = true
    console.log(`  [OK] Migrated to ${newKey}`)
    return result
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error)
    return result
  }
}

async function main() {
  console.log('='.repeat(60))
  console.log('PDF Migration: Supabase Storage -> Cloudflare R2')
  if (DRY_RUN) console.log('MODE: DRY RUN (no changes will be made)')
  console.log('='.repeat(60))

  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
  ]

  const missing = requiredEnvVars.filter((v) => !process.env[v])
  if (missing.length > 0) {
    console.error(`Missing env vars: ${missing.join(', ')}`)
    process.exit(1)
  }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const r2 = createR2Client()

  console.log('\n1. Fetching products with PDF paths...')
  const { data: products, error } = await supabase
    .from('products')
    .select('id, mill_name, name, file_url, source_pdf_path, created_by')
    .or('file_url.not.is.null,source_pdf_path.not.is.null')

  if (error) {
    console.error(`Failed to fetch products: ${error.message}`)
    process.exit(1)
  }

  if (!products || products.length === 0) {
    console.log('No products with PDF paths found. Nothing to migrate.')
    process.exit(0)
  }

  console.log(`Found ${products.length} products with PDF paths`)

  const toMigrate = products.filter(
    (p) =>
      isSupabaseStoragePath(p.file_url) ||
      isSupabaseStoragePath(p.source_pdf_path)
  )

  if (toMigrate.length === 0) {
    console.log('\nAll PDFs already migrated to R2. Nothing to do.')
    process.exit(0)
  }

  console.log(`${toMigrate.length} products need migration`)

  console.log('\n2. Starting migration...')
  const results: MigrationResult[] = []

  for (const product of toMigrate) {
    console.log(`\nProduct: ${product.mill_name} - ${product.name}`)

    if (isSupabaseStoragePath(product.file_url)) {
      const result = await migrateFile(
        supabase,
        r2,
        product,
        'file_url',
        product.file_url!
      )
      results.push(result)
    }

    if (isSupabaseStoragePath(product.source_pdf_path)) {
      const result = await migrateFile(
        supabase,
        r2,
        product,
        'source_pdf_path',
        product.source_pdf_path!
      )
      results.push(result)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('Migration Summary')
  console.log('='.repeat(60))

  const successful = results.filter((r) => r.success)
  const failed = results.filter((r) => !r.success)

  console.log(`Total: ${results.length}`)
  console.log(`Successful: ${successful.length}`)
  console.log(`Failed: ${failed.length}`)

  if (failed.length > 0) {
    console.log('\nFailed migrations:')
    for (const f of failed) {
      console.log(`  - ${f.productId} (${f.field}): ${f.error}`)
    }
  }

  if (DRY_RUN) {
    console.log(
      '\n[DRY RUN] No changes were made. Run without --dry-run to execute.'
    )
  }
}

main().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
