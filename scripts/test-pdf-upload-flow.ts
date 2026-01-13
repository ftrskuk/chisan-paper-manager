/**
 * E2E test for PDF upload flow via R2 storage layer
 * Run: npx tsx scripts/test-pdf-upload-flow.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import {
  uploadTdsPdf,
  uploadSourcePdf,
  getSignedDownloadUrl,
  deleteFile,
} from '../lib/storage/storage'

const TEST_USER_ID = 'test-user-e2e'

function createMockPdfBuffer(): Buffer {
  const pdfHeader = '%PDF-1.4\n'
  const pdfContent = '1 0 obj\n<< /Type /Catalog >>\nendobj\n'
  const pdfTrailer = 'trailer\n<< /Root 1 0 R >>\n%%EOF'
  return Buffer.from(pdfHeader + pdfContent + pdfTrailer)
}

async function testTdsPdfUpload(): Promise<string> {
  console.log('\n1. Testing TDS PDF upload...')
  const buffer = createMockPdfBuffer()
  const result = await uploadTdsPdf(TEST_USER_ID, 'test-tds.pdf', buffer)
  console.log(`   Uploaded to: ${result.key}`)
  return result.key
}

async function testSourcePdfUpload(): Promise<string> {
  console.log('\n2. Testing Source PDF upload...')
  const buffer = createMockPdfBuffer()
  const result = await uploadSourcePdf(
    TEST_USER_ID,
    'Test Mill',
    'Test Product',
    buffer
  )
  console.log(`   Uploaded to: ${result.key}`)
  return result.key
}

async function testSignedUrlGeneration(key: string): Promise<void> {
  console.log('\n3. Testing signed URL generation...')
  const url = await getSignedDownloadUrl(key, 60)
  console.log(`   Generated URL (expires in 60s)`)
  console.log(`   URL prefix: ${url.slice(0, 80)}...`)
}

async function testFileDelete(keys: string[]): Promise<void> {
  console.log('\n4. Cleaning up test files...')
  for (const key of keys) {
    await deleteFile(key)
    console.log(`   Deleted: ${key}`)
  }
}

async function main() {
  console.log('='.repeat(50))
  console.log('PDF Upload Flow E2E Test')
  console.log('='.repeat(50))

  const uploadedKeys: string[] = []

  try {
    const tdsKey = await testTdsPdfUpload()
    uploadedKeys.push(tdsKey)

    const sourceKey = await testSourcePdfUpload()
    uploadedKeys.push(sourceKey)

    await testSignedUrlGeneration(tdsKey)

    await testFileDelete(uploadedKeys)

    console.log('\n' + '='.repeat(50))
    console.log('All PDF upload flow tests passed!')
    console.log('='.repeat(50))
  } catch (error) {
    console.error('\nTest failed:', error)

    if (uploadedKeys.length > 0) {
      console.log('\nCleaning up partial uploads...')
      for (const key of uploadedKeys) {
        try {
          await deleteFile(key)
        } catch {
          console.error(`   Failed to delete: ${key}`)
        }
      }
    }

    process.exit(1)
  }
}

main()
