'use client'

import { useState, useRef } from 'react'
import { useProductForm } from './use-product-form'
import { SpecVariantForm } from './spec-variant-form'
import { uploadSourcePdf, deleteSourcePdf } from '@/lib/actions/pdf-upload'
import type { ProductFormData } from '@/lib/validations/product'
import type { Category } from '@/types/database'

interface PdfInfo {
  path: string
  filename: string
}

interface ProductFormProps {
  categories: Category[]
  onSubmit: (
    data: ProductFormData,
    pdfInfo?: PdfInfo | null,
    clearPdf?: boolean
  ) => Promise<void>
  defaultValues?: Partial<ProductFormData>
  existingPdf?: PdfInfo | null
}

export function ProductForm({
  categories,
  onSubmit,
  defaultValues,
  existingPdf,
}: ProductFormProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isUploadingPdf, setIsUploadingPdf] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [clearExistingPdf, setClearExistingPdf] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    form: {
      register,
      formState: { errors },
      getValues,
    },
    fields,
    isSubmitting,
    extraSpecsPerSpec,
    submitHandler: originalSubmitHandler,
    actions: {
      handleAddSpec,
      handleRemoveSpec,
      addExtraSpec,
      removeExtraSpec,
      updateExtraSpec,
    },
  } = useProductForm({
    defaultValues,
    onSubmit: async (data) => {
      let pdfInfo: PdfInfo | null = null

      if (pdfFile) {
        setIsUploadingPdf(true)
        setPdfError(null)
        try {
          const formData = new FormData()
          formData.append('file', pdfFile)
          const result = await uploadSourcePdf(
            formData,
            data.mill_name,
            data.name
          )
          pdfInfo = { path: result.path, filename: result.filename }

          if (existingPdf?.path && !clearExistingPdf) {
            await deleteSourcePdf(existingPdf.path).catch(() => {})
          }
        } catch (error) {
          setPdfError(
            error instanceof Error ? error.message : 'PDF upload failed'
          )
          setIsUploadingPdf(false)
          throw error
        }
        setIsUploadingPdf(false)
      }

      await onSubmit(data, pdfInfo, clearExistingPdf && !pdfFile)
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setPdfError(null)

    if (!file) {
      setPdfFile(null)
      return
    }

    if (file.type !== 'application/pdf') {
      setPdfError('Only PDF files are allowed')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setPdfError('File size must be less than 10MB')
      return
    }

    setPdfFile(file)
    setClearExistingPdf(false)
  }

  const handleRemovePdf = () => {
    setPdfFile(null)
    setClearExistingPdf(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const showExistingPdf = existingPdf && !clearExistingPdf && !pdfFile
  const isBusy = isSubmitting || isUploadingPdf

  return (
    <form
      onSubmit={originalSubmitHandler}
      className="space-y-8 max-w-5xl mx-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mill Name
          </label>
          <input
            {...register('mill_name')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all hover:border-gray-400"
            placeholder="e.g., Asia Symbol"
          />
          {errors.mill_name && (
            <p className="mt-1 text-sm text-red-600 font-medium">
              {errors.mill_name.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Name
          </label>
          <input
            {...register('name')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all hover:border-gray-400"
            placeholder="e.g., Premium Kraft"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 font-medium">
              {errors.name.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <div className="relative">
          <select
            {...register('category_id')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white transition-all hover:border-gray-400"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <svg
              className="h-4 w-4 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Source TDS (PDF)
        </label>
        <div className="space-y-2">
          {showExistingPdf && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm text-gray-700 flex-1 truncate">
                {existingPdf.filename}
              </span>
              <button
                type="button"
                onClick={handleRemovePdf}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          )}

          {pdfFile && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <svg
                className="w-5 h-5 text-blue-500 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm text-blue-700 flex-1 truncate">
                {pdfFile.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  setPdfFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Remove
              </button>
            </div>
          )}

          {!showExistingPdf && !pdfFile && (
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-6 h-6 mb-2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> PDF
                    (max 10MB)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="application/pdf"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}

          {pdfError && (
            <p className="text-sm text-red-600 font-medium">{pdfError}</p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Specifications by GSM
          </h3>
          <button
            type="button"
            onClick={handleAddSpec}
            className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
          >
            + Add Variant
          </button>
        </div>

        {fields.map((field, index) => (
          <SpecVariantForm
            key={field.id}
            index={index}
            register={register}
            errors={errors}
            extraSpecs={extraSpecsPerSpec[index] || []}
            showRemove={fields.length > 1}
            onRemove={() => handleRemoveSpec(index)}
            onAddExtraSpec={() => addExtraSpec(index)}
            onRemoveExtraSpec={(extraIndex) =>
              removeExtraSpec(index, extraIndex)
            }
            onUpdateExtraSpec={(extraIndex, field, value) =>
              updateExtraSpec(index, extraIndex, field, value)
            }
          />
        ))}

        {errors.specs && !Array.isArray(errors.specs) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
            {errors.specs.message}
          </div>
        )}
      </div>

      <div className="pt-4 sticky bottom-0 bg-white/80 backdrop-blur-sm border-t border-gray-100">
        <button
          type="submit"
          disabled={isBusy}
          className="w-full md:w-auto md:min-w-[200px] float-right py-2.5 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40"
        >
          {isBusy ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {isUploadingPdf ? 'Uploading PDF...' : 'Saving...'}
            </span>
          ) : (
            'Save Product'
          )}
        </button>
      </div>
    </form>
  )
}
