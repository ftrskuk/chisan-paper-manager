'use client'

import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { ProductFormData } from '@/lib/validations/product'
import { ExtraSpecsForm } from './extra-specs-form'

type ExtraSpecEntry = { key: string; value: string }

interface SpecVariantFormProps {
  index: number
  register: UseFormRegister<ProductFormData>
  errors: FieldErrors<ProductFormData>
  extraSpecs: ExtraSpecEntry[]
  showRemove: boolean
  onRemove: () => void
  onAddExtraSpec: () => void
  onRemoveExtraSpec: (extraIndex: number) => void
  onUpdateExtraSpec: (
    extraIndex: number,
    field: 'key' | 'value',
    value: string
  ) => void
}

export function SpecVariantForm({
  index,
  register,
  errors,
  extraSpecs,
  showRemove,
  onRemove,
  onAddExtraSpec,
  onRemoveExtraSpec,
  onUpdateExtraSpec,
}: SpecVariantFormProps) {
  return (
    <div className="p-6 border border-gray-200 rounded-xl bg-gray-50/50 hover:bg-white hover:shadow-md transition-all duration-200 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
            {index + 1}
          </span>
          <h4 className="font-medium text-gray-900">Variant Details</h4>
        </div>
        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label
            htmlFor={`specs.${index}.gsm`}
            className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5"
          >
            GSM (g/m²)
          </label>
          <input
            id={`specs.${index}.gsm`}
            type="number"
            {...register(`specs.${index}.gsm`, { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white"
            placeholder="100"
          />
          {errors.specs?.[index]?.gsm && (
            <p className="mt-1 text-xs text-red-600">
              {errors.specs[index]?.gsm?.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={`specs.${index}.caliper`}
            className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5"
          >
            Caliper (µm)
          </label>
          <input
            id={`specs.${index}.caliper`}
            type="number"
            step="0.1"
            {...register(`specs.${index}.caliper`, { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="150"
          />
          {errors.specs?.[index]?.caliper && (
            <p className="mt-1 text-xs text-red-600">
              {errors.specs[index]?.caliper?.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={`specs.${index}.tensile_md`}
            className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5"
          >
            Tensile MD (kN/m)
          </label>
          <input
            id={`specs.${index}.tensile_md`}
            type="number"
            step="0.001"
            {...register(`specs.${index}.tensile_md`, { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="5.5"
          />
        </div>

        <div>
          <label
            htmlFor={`specs.${index}.tensile_cd`}
            className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5"
          >
            Tensile CD (kN/m)
          </label>
          <input
            id={`specs.${index}.tensile_cd`}
            type="number"
            step="0.001"
            {...register(`specs.${index}.tensile_cd`, { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="4.2"
          />
        </div>

        <div>
          <label
            htmlFor={`specs.${index}.tear_md`}
            className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5"
          >
            Tear MD (mN)
          </label>
          <input
            id={`specs.${index}.tear_md`}
            type="number"
            step="1"
            {...register(`specs.${index}.tear_md`, { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="800"
          />
        </div>

        <div>
          <label
            htmlFor={`specs.${index}.tear_cd`}
            className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5"
          >
            Tear CD (mN)
          </label>
          <input
            id={`specs.${index}.tear_cd`}
            type="number"
            step="1"
            {...register(`specs.${index}.tear_cd`, { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="900"
          />
        </div>
      </div>

      <ExtraSpecsForm
        extraSpecs={extraSpecs}
        onAdd={onAddExtraSpec}
        onRemove={onRemoveExtraSpec}
        onUpdate={onUpdateExtraSpec}
      />
    </div>
  )
}
