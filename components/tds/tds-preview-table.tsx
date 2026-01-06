'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Trash2, Plus, ChevronDown, ChevronUp, Code, X } from 'lucide-react'
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
  smoothness_value: number | null
  smoothness_unit: string
  smoothness_method: string
  stiffness_md_value: number | null
  stiffness_cd_value: number | null
  whiteness: number | null
  density: number | null
  opacity: number | null
  moisture: number | null
}

interface ExtraSpecItem {
  key: string
  value: string
}

interface FormValues {
  mill_name: string
  product_name: string
  category_id: string
  file_url: string
  specs: FlatSpec[]
  extra_specs: ExtraSpecItem[]
}

const SMOOTHNESS_UNITS = ['sec', 'ml/min', 'µm']
const SMOOTHNESS_METHODS = ['Bekk', 'Bendtsen', 'PPS']
const STIFFNESS_UNIT = 'mN·m'

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
  const [showExtraSpecs, setShowExtraSpecs] = useState(false)

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
        smoothness_value: spec.smoothness?.value ?? null,
        smoothness_unit: spec.smoothness?.unit ?? 'sec',
        smoothness_method: spec.smoothness?.method ?? 'Bekk',
        stiffness_md_value: spec.stiffness_md?.value ?? null,
        stiffness_cd_value: spec.stiffness_cd?.value ?? null,
        whiteness: null,
        density: null,
        opacity: spec.opacity ?? null,
        moisture: spec.moisture ?? null,
      })),
      extra_specs:
        Object.entries(parsedData.specs[0]?.extra_specs || {}).map(
          ([key, value]) => ({
            key,
            value: String(value),
          })
        ) || [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'specs',
  })

  const {
    fields: extraSpecFields,
    append: appendExtraSpec,
    remove: removeExtraSpec,
  } = useFieldArray({
    control: form.control,
    name: 'extra_specs',
  })

  const convertFormToTDSData = (data: FormValues): TDSProductFormData => {
    const extraSpecsRecord: Record<string, unknown> = {}
    data.extra_specs.forEach((item) => {
      if (item.key.trim()) {
        extraSpecsRecord[item.key.trim()] = item.value
      }
    })

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
        smoothness:
          spec.smoothness_value != null && !isNaN(spec.smoothness_value)
            ? {
                value: spec.smoothness_value,
                unit: spec.smoothness_unit as 'sec' | 'ml/min' | 'µm',
                method: spec.smoothness_method as 'Bekk' | 'Bendtsen' | 'PPS',
              }
            : null,
        stiffness_md:
          spec.stiffness_md_value != null && !isNaN(spec.stiffness_md_value)
            ? { value: spec.stiffness_md_value, unit: 'mN·m' as const }
            : null,
        stiffness_cd:
          spec.stiffness_cd_value != null && !isNaN(spec.stiffness_cd_value)
            ? { value: spec.stiffness_cd_value, unit: 'mN·m' as const }
            : null,
        brightness:
          spec.brightness != null && !isNaN(spec.brightness)
            ? spec.brightness
            : null,
        cobb_60:
          spec.cobb_60 != null && !isNaN(spec.cobb_60) ? spec.cobb_60 : null,
        density:
          spec.density != null && !isNaN(spec.density) ? spec.density : null,
        opacity:
          spec.opacity != null && !isNaN(spec.opacity)
            ? Math.min(100, Math.max(0, spec.opacity))
            : null,
        moisture:
          spec.moisture != null && !isNaN(spec.moisture)
            ? Math.min(100, Math.max(0, spec.moisture))
            : null,
        extra_specs:
          Object.keys(extraSpecsRecord).length > 0
            ? extraSpecsRecord
            : undefined,
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
      smoothness_value: null,
      smoothness_unit: 'sec',
      smoothness_method: 'Bekk',
      stiffness_md_value: null,
      stiffness_cd_value: null,
      whiteness: null,
      density: null,
      opacity: null,
      moisture: null,
    })
  }

  const addExtraSpec = () => {
    appendExtraSpec({ key: '', value: '' })
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowExtraSpecs(!showExtraSpecs)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <Code className="w-4 h-4" />
              Extra Specs
              {showExtraSpecs ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={addSpec}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <Plus className="w-4 h-4" /> Add Row
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-16">
                  GSM
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">
                  Caliper
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-24">
                  Tensile MD
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-24">
                  Tensile CD
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-20">
                  Tear MD
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-20">
                  Tear CD
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-20">
                  Brightness
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-20">
                  Cobb 60
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-36">
                  Smoothness
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">
                  Stiffness MD
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">
                  Stiffness CD
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-20">
                  Opacity
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 w-20">
                  Moisture
                </th>
                <th className="px-3 py-2 text-center font-medium text-gray-600 w-12">
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
                        className="w-16 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
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
                      className="w-16 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
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
                      className="w-16 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                      placeholder="-"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
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
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="any"
                          {...form.register(`specs.${index}.smoothness_value`, {
                            setValueAs: parseNumber,
                          })}
                          className="w-14 px-1 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                          placeholder="-"
                        />
                        <select
                          {...form.register(`specs.${index}.smoothness_unit`)}
                          className="px-1 py-1 border rounded text-xs w-14"
                        >
                          {SMOOTHNESS_UNITS.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      </div>
                      <select
                        {...form.register(`specs.${index}.smoothness_method`)}
                        className="px-1 py-1 border rounded text-xs w-full"
                      >
                        {SMOOTHNESS_METHODS.map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="any"
                      {...form.register(`specs.${index}.stiffness_md_value`, {
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
                      {...form.register(`specs.${index}.stiffness_cd_value`, {
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
                      min="0"
                      max="100"
                      {...form.register(`specs.${index}.opacity`, {
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
                      min="0"
                      max="100"
                      {...form.register(`specs.${index}.moisture`, {
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

      {showExtraSpecs && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Extra Specifications</h3>
            <button
              type="button"
              onClick={addExtraSpec}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <Plus className="w-4 h-4" /> Add Field
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {extraSpecFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                >
                  <input
                    {...form.register(`extra_specs.${index}.key`)}
                    placeholder="Key"
                    className="flex-1 px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-gray-400">:</span>
                  <input
                    {...form.register(`extra_specs.${index}.value`)}
                    placeholder="Value"
                    className="flex-1 px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeExtraSpec(index)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {extraSpecFields.length === 0 && (
                <p className="text-sm text-gray-500 col-span-full text-center py-4">
                  No extra specifications. Click &quot;Add Field&quot; to add
                  custom key-value pairs.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

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
