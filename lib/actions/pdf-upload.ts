'use server'

import { createClient } from '@/utils/supabase/server'
import { requireAdmin, getUser } from '@/lib/auth'

const MAX_FILE_SIZE = 10 * 1024 * 1024

function sanitizeForFilename(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

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

  const supabase = await createClient()
  const timestamp = Date.now()
  const safeMill = sanitizeForFilename(millName)
  const safeProduct = sanitizeForFilename(productName)
  const filename = `${safeMill}_${safeProduct}_${timestamp}.pdf`
  const filePath = `source-pdfs/${user.id}/${filename}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from('spec-sheets')
    .upload(filePath, buffer, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  return { path: filePath, filename }
}

export async function deleteSourcePdf(path: string): Promise<void> {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.storage.from('spec-sheets').remove([path])

  if (error) {
    console.error('Failed to delete old PDF:', error.message)
  }
}

export async function getSourcePdfUrl(path: string): Promise<string> {
  const supabase = await createClient()

  const { data } = await supabase.storage
    .from('spec-sheets')
    .createSignedUrl(path, 3600)

  if (!data?.signedUrl) {
    throw new Error('Failed to generate signed URL')
  }

  return data.signedUrl
}
