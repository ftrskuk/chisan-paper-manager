'use server'

import { requireAdmin, getUser } from '@/lib/auth'
import {
  uploadSourcePdf as uploadSourcePdfToStorage,
  getSignedDownloadUrl,
  deleteFile,
  generateTimestampedFilename,
} from '@/lib/storage/storage'

const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function uploadSourcePdf(
  formData: FormData,
  millName: string,
  productName: string
): Promise<{ path: string; filename: string }> {
  await requireAdmin()
  const user = await getUser()
  if (!user) throw new Error('Not authenticated')

  const file = formData.get('file') as File
  if (!file) {
    throw new Error('No file provided')
  }

  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are allowed')
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size must be less than 10MB')
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const result = await uploadSourcePdfToStorage(
    user.id,
    millName,
    productName,
    buffer
  )

  const filename = generateTimestampedFilename(millName, productName)

  return { path: result.key, filename }
}

export async function deleteSourcePdf(path: string): Promise<void> {
  await requireAdmin()
  try {
    await deleteFile(path)
  } catch (error) {
    console.error('Failed to delete old PDF:', error)
  }
}

export async function getSourcePdfUrl(path: string): Promise<string> {
  return getSignedDownloadUrl(path, 3600)
}
