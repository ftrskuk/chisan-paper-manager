'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2, Plus } from 'lucide-react'
import { tdsProductFormSchema, type TDSProductFormData } from '@/lib/validations/product'
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

export function TDSPreviewTable({
  parsedData,
  fileUrl,
  categories,
  onSave,
  onCancel,
  isSaving,
}: TDSPreviewTableProps) {
  const [saveError, setSaveError] = useState<string | null>(null)

  const form = useForm<TDSProductFormData>({
    resolver: zodResolver(tdsProductFormSchema),
    defaultValues: {
      mill_name: parsedData.mill_name,
      product_name: parsedData.product_name,
      category_id: undefined,
      file_url: fileUrl,
      specs: parsedData.specs.map(spec => ({
        gsm: spec.gsm,
        caliper: spec.caliper,
        tensile_md: spec.tensile_md,
        tensile_cd: spec.tensile_cd,
        tear_md: spec.tear_md,
        tear_cd: spec.tear_cd,
        smoothness: spec.smoothness,
        stiffness_md: spec.stiffness_md,
        stiffness_cd: spec.stiffness_cd,
        brightness: spec.brightness,
        cobb_60: spec.cobb_60,
        density: spec.density,
        opacity: spec.opacity,
        moisture: spec.moisture,
        extra_specs: spec.extra_specs || {},
      })),
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'specs',
  })

  const handleSubmit = async (data: TDSProductFormData) => {
    setSaveError(null)
    try {
      await onSave(data)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save')
    }
  }

  const addSpec = () => {
    append({
      gsm: 100,
      caliper: { value: 100, unit: 'µm' },
      extra_specs: {},
    })
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mill Name</label>
          <input
            {...form.register('mill_name')}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {form.formState.errors.mill_name && (
            <p className="text-red-500 text-sm mt-1">{form.formState.errors.mill_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
          <input
            {...form.register('product_name')}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {form.formState.errors.product_name && (
            <p className="text-red-500 text-sm mt-1">{form.formState.errors.product_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            {...form.register('category_id')}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select category...</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Specifications ({fields.length} GSM variants)</h3>
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
                <th className="px-3 py-2 text-left font-medium text-gray-600">GSM</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Caliper</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Tensile MD</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Tensile CD</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Tear MD</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Tear CD</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Brightness</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Cobb 60</th>
                <th className="px-3 py-2 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {fields.map((field, index) => (
                <tr key={field.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      {...form.register(`specs.${index}.gsm`, { valueAsNumber: true })}
                      className="w-20 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.01"
                        {...form.register(`specs.${index}.caliper.value`, { valueAsNumber: true })}
                        className="w-20 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                      />
                      <select
                        {...form.register(`specs.${index}.caliper.unit`)}
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
                      step="0.01"
                      {...form.register(`specs.${index}.tensile_md.value`, { valueAsNumber: true })}
                      className="w-20 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                      placeholder="-"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      {...form.register(`specs.${index}.tensile_cd.value`, { valueAsNumber: true })}
                      className="w-20 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                      placeholder="-"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.1"
                      {...form.register(`specs.${index}.tear_md.value`, { valueAsNumber: true })}
                      className="w-20 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                      placeholder="-"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.1"
                      {...form.register(`specs.${index}.tear_cd.value`, { valueAsNumber: true })}
                      className="w-20 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                      placeholder="-"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.1"
                      {...form.register(`specs.${index}.brightness`, { valueAsNumber: true })}
                      className="w-16 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                      placeholder="-"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.1"
                      {...form.register(`specs.${index}.cobb_60`, { valueAsNumber: true })}
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
          <p className="text-sm text-yellow-800"><strong>AI Notes:</strong> {parsedData.notes}</p>
        </div>
      )}

      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{saveError}</p>
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
