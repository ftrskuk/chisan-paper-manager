'use client'

import { useCallback, useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TDSUploadDropzoneProps {
  onFileSelect: (file: File) => void
  isUploading?: boolean
  disabled?: boolean
}

export function TDSUploadDropzone({
  onFileSelect,
  isUploading,
  disabled,
}: TDSUploadDropzoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setError(null)

      if (fileRejections.length > 0) {
        const firstError = fileRejections[0]?.errors[0]
        setError(firstError?.message || 'Invalid file')
        return
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        setSelectedFile(file)
        onFileSelect(file)
      }
    },
    [onFileSelect]
  )

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: disabled || isUploading,
  })

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedFile(null)
    setError(null)
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200',
          isDragActive && 'border-blue-500 bg-blue-50',
          isDragAccept && 'border-green-500 bg-green-50',
          isDragReject && 'border-red-500 bg-red-50',
          !isDragActive &&
            !selectedFile &&
            'border-gray-300 hover:border-gray-400 hover:bg-gray-50',
          selectedFile && 'border-green-500 bg-green-50',
          (disabled || isUploading) && 'opacity-50 cursor-not-allowed',
          error && 'border-red-500 bg-red-50'
        )}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-blue-600 font-medium">Uploading...</p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center gap-3">
            <FileText className="w-12 h-12 text-green-600" />
            <div className="flex items-center gap-2">
              <span className="text-green-700 font-medium">
                {selectedFile.name}
              </span>
              <button
                onClick={clearFile}
                className="p-1 hover:bg-green-200 rounded-full transition-colors"
                type="button"
              >
                <X className="w-4 h-4 text-green-700" />
              </button>
            </div>
            <p className="text-sm text-green-600">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {isDragReject || error ? (
              <>
                <AlertCircle className="w-12 h-12 text-red-500" />
                <p className="text-red-600 font-medium">
                  {error || 'Only PDF files are allowed'}
                </p>
              </>
            ) : (
              <>
                <Upload
                  className={cn(
                    'w-12 h-12',
                    isDragActive ? 'text-blue-500' : 'text-gray-400'
                  )}
                />
                <div>
                  <p
                    className={cn(
                      'font-medium',
                      isDragActive ? 'text-blue-600' : 'text-gray-700'
                    )}
                  >
                    {isDragActive
                      ? 'Drop your TDS PDF here'
                      : 'Drag & drop your TDS PDF here'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    or click to browse (max 10MB)
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
