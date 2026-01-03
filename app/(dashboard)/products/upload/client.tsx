'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TDSUploadDropzone } from '@/components/tds/tds-upload-dropzone'
import {
  TDSParsingStatus,
  type ParseStatus,
} from '@/components/tds/tds-parsing-status'
import { TDSPreviewTable } from '@/components/tds/tds-preview-table'
import {
  uploadTDSPdf,
  parseTDS,
  saveTDSProduct,
  getStorageUrl,
  deleteStorageFile,
} from '@/lib/actions/tds-upload'
import type { Category, TDSParseResult } from '@/types/database'
import type { TDSProductFormData } from '@/lib/validations/product'

interface TDSUploadClientProps {
  categories: Category[]
}

interface UploadState {
  status: ParseStatus
  error: string | null
  filePath: string | null
  fileUrl: string | null
  parsedData: TDSParseResult | null
}

const initialState: UploadState = {
  status: 'idle',
  error: null,
  filePath: null,
  fileUrl: null,
  parsedData: null,
}

export function TDSUploadClient({ categories }: TDSUploadClientProps) {
  const router = useRouter()
  const [state, setState] = useState<UploadState>(initialState)

  const handleFileSelect = useCallback(async (file: File) => {
    setState((prev) => ({ ...prev, status: 'uploading', error: null }))

    try {
      const formData = new FormData()
      formData.append('file', file)

      const { path, base64 } = await uploadTDSPdf(formData)

      setState((prev) => ({ ...prev, status: 'parsing', filePath: path }))

      const parsedData = await parseTDS(base64)

      const fileUrl = await getStorageUrl(path)

      setState((prev) => ({
        ...prev,
        status: 'preview',
        parsedData,
        fileUrl,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      }))
    }
  }, [])

  const handleSave = useCallback(
    async (data: TDSProductFormData) => {
      setState((prev) => ({ ...prev, status: 'saving' }))

      try {
        const product = await saveTDSProduct(data)
        setState((prev) => ({ ...prev, status: 'complete' }))

        setTimeout(() => {
          router.push(`/products/${product.id}`)
        }, 1500)
      } catch (error) {
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: error instanceof Error ? error.message : 'Failed to save',
        }))
      }
    },
    [router]
  )

  const handleCancel = useCallback(async () => {
    if (state.filePath) {
      try {
        await deleteStorageFile(state.filePath)
      } catch {
        // Best-effort cleanup - user cancelled, proceed regardless of delete success
      }
    }
    setState(initialState)
  }, [state.filePath])

  const handleRetry = useCallback(() => {
    setState(initialState)
  }, [])

  return (
    <div className="space-y-6">
      {state.status === 'idle' && (
        <TDSUploadDropzone onFileSelect={handleFileSelect} />
      )}

      <TDSParsingStatus
        status={state.status}
        error={state.error}
        onRetry={handleRetry}
      />

      {state.status === 'preview' && state.parsedData && state.fileUrl && (
        <TDSPreviewTable
          parsedData={state.parsedData}
          fileUrl={state.fileUrl}
          categories={categories}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {state.status === 'uploading' && (
        <TDSUploadDropzone onFileSelect={handleFileSelect} isUploading />
      )}
    </div>
  )
}
