/**
 * R2 Connection Test Script
 * Run: npx tsx scripts/test-r2-connection.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const REQUIRED_VARS = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
] as const

function checkEnvVars(): boolean {
  console.log('\n1. Checking environment variables...')
  let allPresent = true

  for (const key of REQUIRED_VARS) {
    const value = process.env[key]
    if (value) {
      const masked = key.includes('SECRET')
        ? '***' + value.slice(-4)
        : value.slice(0, 8) + '...'
      console.log(`   ${key}: ${masked}`)
    } else {
      console.error(`   ${key}: MISSING`)
      allPresent = false
    }
  }

  if (process.env.R2_PUBLIC_URL) {
    console.log(`   R2_PUBLIC_URL: ${process.env.R2_PUBLIC_URL} (optional)`)
  }

  return allPresent
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

async function testBucketAccess(client: S3Client): Promise<boolean> {
  console.log('\n2. Testing bucket access...')
  try {
    await client.send(
      new HeadBucketCommand({ Bucket: process.env.R2_BUCKET_NAME! })
    )
    console.log(`   Bucket "${process.env.R2_BUCKET_NAME}" is accessible`)
    return true
  } catch (error) {
    const err = error as Error
    console.error(`   Failed to access bucket: ${err.message}`)
    return false
  }
}

async function testUploadDownloadDelete(client: S3Client): Promise<boolean> {
  const testKey = `_test/connection-test-${Date.now()}.txt`
  const testContent = `R2 connection test at ${new Date().toISOString()}`
  const bucket = process.env.R2_BUCKET_NAME!

  console.log('\n3. Testing upload/download/delete cycle...')

  try {
    console.log(`   Uploading test file: ${testKey}`)
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: testKey,
        Body: Buffer.from(testContent),
        ContentType: 'text/plain',
      })
    )
    console.log('   Upload successful')

    console.log('   Generating signed download URL...')
    const downloadUrl = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: testKey }),
      { expiresIn: 60 }
    )
    console.log(`   Signed URL generated (expires in 60s)`)

    console.log('   Downloading and verifying content...')
    const response = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: testKey })
    )
    const downloadedContent = await response.Body?.transformToString()

    if (downloadedContent === testContent) {
      console.log('   Content verified successfully')
    } else {
      console.error('   Content mismatch!')
      return false
    }

    console.log('   Deleting test file...')
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: testKey }))
    console.log('   Delete successful')

    return true
  } catch (error) {
    const err = error as Error
    console.error(`   Test failed: ${err.message}`)
    return false
  }
}

function printEnvHelp(): void {
  console.log('\nAdd the following to your .env.local:')
  console.log('  R2_ACCOUNT_ID=your_cloudflare_account_id')
  console.log('  R2_ACCESS_KEY_ID=your_r2_access_key_id')
  console.log('  R2_SECRET_ACCESS_KEY=your_r2_secret_access_key')
  console.log('  R2_BUCKET_NAME=chisan-files')
}

function printBucketHelp(): void {
  console.log('\nVerify:')
  console.log('  1. R2_ACCOUNT_ID is your Cloudflare account ID')
  console.log('  2. R2_BUCKET_NAME bucket exists in your R2 dashboard')
  console.log('  3. API token has read/write permissions for the bucket')
}

async function main() {
  console.log('='.repeat(50))
  console.log('R2 Connection Test')
  console.log('='.repeat(50))

  if (!checkEnvVars()) {
    console.error('\nFailed: Missing required environment variables')
    printEnvHelp()
    process.exit(1)
  }

  const client = createR2Client()

  if (!(await testBucketAccess(client))) {
    console.error('\nFailed: Cannot access R2 bucket')
    printBucketHelp()
    process.exit(1)
  }

  if (!(await testUploadDownloadDelete(client))) {
    console.error('\nFailed: Upload/download/delete cycle failed')
    process.exit(1)
  }

  console.log('\n' + '='.repeat(50))
  console.log('All tests passed! R2 is configured correctly.')
  console.log('='.repeat(50))
}

main().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
