'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Trash2, Plus } from 'lucide-react'
import { tdsProductFormSchema } from '@/lib/validations/product'
import type { TDSProductFormData } from '@/lib/validations/product'
import type { TDSParseResult, Category } from '@/types/database'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface TDSPreviewTableProps {
  parsedData: TDSParseResult
  fileUrl: string
  categories: Category[]
  onSave: (data: TDSProductFormData) => Promise<void>
  onCancel: () => void
  isSaving?: boolean
}

interface FlatSpec {
  gsm: number
  caliper_value: number | null
  caliper_unit: string
  tensile_md_value: number | null
  tensile_cd_value: number | null
  tear_md_value: number | null
  tear_cd_value: number | null
  brightness: number | null
  cobb_60: number | null
}

interface FormValues {
  mill_name: string
  product_name: string
  category_id: string
  file_url: string
  specs: FlatSpec[]
}

export function TDSPreviewTable({
  parsedData,
  fileUrl,
  categories,
  onSave,
  onCancel,
  isSaving,
}: TDSPreviewTableProps) {
  const [saveError, setSaveError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    defaultValues: {
      mill_name: parsedData.mill_name || '',
      product_name: parsedData.product_name || '',
      category_id: '',
      file_url: fileUrl,
      specs: parsedData.specs.map((spec) => ({
        gsm: spec.gsm,
        caliper_value: spec.caliper?.value ?? null,
        caliper_unit: spec.caliper?.unit ?? 'µm',
        tensile_md_value: spec.tensile_md?.value ?? null,
        tensile_cd_value: spec.tensile_cd?.value ?? null,
        tear_md_value: spec.tear_md?.value ?? null,
        tear_cd_value: spec.tear_cd?.value ?? null,
        brightness: spec.brightness ?? null,
        cobb_60: spec.cobb_60 ?? null,
      })),
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'specs',
  })

  const convertFormToTDSData = (data: FormValues): TDSProductFormData => {
    return {
      mill_name: data.mill_name.trim(),
      product_name: data.product_name.trim(),
      category_id: data.category_id || undefined,
      file_url: data.file_url,
      specs: data.specs.map((spec) => ({
        gsm: spec.gsm,
        caliper:
          spec.caliper_value != null && !isNaN(spec.caliper_value)
            ? {
                value: spec.caliper_value,
                unit: (spec.caliper_unit as 'µm' | 'mm' | 'mil') || 'µm',
              }
            : null,
        tensile_md:
          spec.tensile_md_value != null && !isNaN(spec.tensile_md_value)
            ? { value: spec.tensile_md_value, unit: 'kN/m' as const }
            : null,
        tensile_cd:
          spec.tensile_cd_value != null && !isNaN(spec.tensile_cd_value)
            ? { value: spec.tensile_cd_value, unit: 'kN/m' as const }
            : null,
        tear_md:
          spec.tear_md_value != null && !isNaN(spec.tear_md_value)
            ? { value: spec.tear_md_value, unit: 'mN' as const }
            : null,
        tear_cd:
          spec.tear_cd_value != null && !isNaN(spec.tear_cd_value)
            ? { value: spec.tear_cd_value, unit: 'mN' as const }
            : null,
        smoothness: null,
        stiffness_md: null,
        stiffness_cd: null,
        brightness:
          spec.brightness != null && !isNaN(spec.brightness)
            ? spec.brightness
            : null,
        cobb_60:
          spec.cobb_60 != null && !isNaN(spec.cobb_60) ? spec.cobb_60 : null,
        density: null,
        opacity: null,
        moisture: null,
        extra_specs: {},
      })),
    }
  }

  const handleFormSubmit = async (data: FormValues) => {
    setSaveError(null)
    setValidationError(null)

    const tdsData = convertFormToTDSData(data)

    const result = tdsProductFormSchema.safeParse(tdsData)
    if (!result.success) {
      const errors = result.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ')
      setValidationError(errors || 'Validation failed')
      return
    }

    try {
      await onSave(result.data)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save')
    }
  }

  const addSpec = () => {
    append({
      gsm: 100,
      caliper_value: 100,
      caliper_unit: 'µm',
      tensile_md_value: null,
      tensile_cd_value: null,
      tear_md_value: null,
      tear_cd_value: null,
      brightness: null,
      cobb_60: null,
    })
  }

  const parseNumber = (v: string): number | null => {
    if (v === '' || v === null || v === undefined) return null
    const num = parseFloat(v)
    return isNaN(num) ? null : num
  }

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mill Name
          </label>
          <input
            {...form.register('mill_name')}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Name
          </label>
          <input
            {...form.register('product_name')}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            {...form.register('category_id')}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-medium text-gray-900">
            Specifications ({fields.length} GSM variants)
          </h3>
          <button
            type="button"
            onClick={addSpec}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <Plus className="w-4 h-4" /> Add Row
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  GSM
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Caliper
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Tensile MD
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Tensile CD
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Tear MD
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Tear CD
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Brightness
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Cobb 60
                </th>
                <th className="px-3 py-2 text-center font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {fields.map((field, index) => (
                <tr key={field.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="any"
                      {...form.register(`specs.${index}.gsm`, {
                        setValueAs: (v) => parseNumber(v) ?? 0,
                      })}
                      className="w-20 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="any"
                        {...form.register(`specs.${index}.caliper_value`, {
                          setValueAs: parseNumber,
                        })}
                        className="w-20 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                      />
                      <select
                        {...form.register(`specs.${index}.caliper_unit`)}
                        className="px-1 py-1 border rounded text-xs"
                      >
                        <option value="µm">µm</option>
                        <option value="mm">mm</option>
                        <option value="mil">mil</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="any"
                      {...form.register(`specs.${index}.tensile_md_value`, {
                        setValueAs: parseNumber,
                      })}
                      className="w-20 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                      placeholder="-"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="any"
                      {...form.register(`specs.${index}.tensile_cd_value`, {
                        setValueAs: parseNumber,
                      })}
                      className="w-20 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                      placeholder="-"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="any"
                      {...form.register(`specs.${index}.tear_md_value`, {
                        setValueAs: parseNumber,
                      })}
                      className="w-20 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                      placeholder="-"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="any"
                      {...form.register(`specs.${index}.tear_cd_value`, {
                        setValueAs: parseNumber,
                      })}
                      className="w-20 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                      placeholder="-"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="any"
                      {...form.register(`specs.${index}.brightness`, {
                        setValueAs: parseNumber,
                      })}
                      className="w-16 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                      placeholder="-"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="any"
                      {...form.register(`specs.${index}.cobb_60`, {
                        setValueAs: parseNumber,
                      })}
                      className="w-16 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                      placeholder="-"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                      className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {parsedData.notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>AI Notes:</strong> {parsedData.notes}
          </p>
        </div>
      )}

      {(saveError || validationError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{saveError || validationError}</p>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <LoadingSpinner size="sm" />
              Saving...
            </>
          ) : (
            'Save Product'
          )}
        </button>
      </div>
    </form>
  )
}
