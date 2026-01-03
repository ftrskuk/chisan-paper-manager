'use client'

import { useProductForm } from './use-product-form'
import type { ProductFormData } from '@/lib/validations/product'
import type { Category } from '@/types/database'

interface ProductFormProps {
  categories: Category[]
  onSubmit: (data: ProductFormData) => Promise<void>
  defaultValues?: Partial<ProductFormData>
}

export function ProductForm({
  categories,
  onSubmit,
  defaultValues,
}: ProductFormProps) {
  const {
    form: {
      register,
      formState: { errors },
    },
    fields,
    isSubmitting,
    extraSpecsPerSpec,
    submitHandler,
    actions: {
      handleAddSpec,
      handleRemoveSpec,
      addExtraSpec,
      removeExtraSpec,
      updateExtraSpec,
    },
  } = useProductForm({ defaultValues, onSubmit })

  return (
    <form onSubmit={submitHandler} className="space-y-8 max-w-5xl mx-auto">
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
          <div
            key={field.id}
            className="p-6 border border-gray-200 rounded-xl bg-gray-50/50 hover:bg-white hover:shadow-md transition-all duration-200 space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                  {index + 1}
                </span>
                <h4 className="font-medium text-gray-900">Variant Details</h4>
              </div>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSpec(index)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  GSM (g/m²)
                </label>
                <input
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Caliper (µm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register(`specs.${index}.caliper`, {
                    valueAsNumber: true,
                  })}
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Tensile MD (kN/m)
                </label>
                <input
                  type="number"
                  step="0.001"
                  {...register(`specs.${index}.tensile_md`, {
                    valueAsNumber: true,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="5.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Tensile CD (kN/m)
                </label>
                <input
                  type="number"
                  step="0.001"
                  {...register(`specs.${index}.tensile_cd`, {
                    valueAsNumber: true,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="4.2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Tear MD (mN)
                </label>
                <input
                  type="number"
                  step="1"
                  {...register(`specs.${index}.tear_md`, {
                    valueAsNumber: true,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Tear CD (mN)
                </label>
                <input
                  type="number"
                  step="1"
                  {...register(`specs.${index}.tear_cd`, {
                    valueAsNumber: true,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="900"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Extra Specifications
                </label>
                <button
                  type="button"
                  onClick={() => addExtraSpec(index)}
                  className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                >
                  + Add Custom Field
                </button>
              </div>

              {extraSpecsPerSpec[index]?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {extraSpecsPerSpec[index].map((extra, extraIndex) => (
                    <div
                      key={extraIndex}
                      className="flex gap-0 shadow-sm rounded-md group hover:shadow-md transition-shadow"
                    >
                      <input
                        type="text"
                        placeholder="Key (e.g., moisture)"
                        value={extra.key}
                        onChange={(e) =>
                          updateExtraSpec(
                            index,
                            extraIndex,
                            'key',
                            e.target.value
                          )
                        }
                        className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 bg-gray-50 font-medium text-gray-700 placeholder-gray-400"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g., 7%)"
                        value={extra.value}
                        onChange={(e) =>
                          updateExtraSpec(
                            index,
                            extraIndex,
                            'value',
                            e.target.value
                          )
                        }
                        className="flex-1 min-w-0 px-3 py-2 text-sm border-l-0 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 bg-white placeholder-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => removeExtraSpec(index, extraIndex)}
                        className="px-3 py-2 text-gray-400 hover:text-red-600 border border-l-0 border-gray-300 rounded-r-md hover:bg-red-50 transition-colors focus:z-10 bg-white"
                        title="Remove field"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-sm text-gray-500">
                    No extra specifications added yet.
                  </p>
                </div>
              )}
            </div>
          </div>
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
          disabled={isSubmitting}
          className="w-full md:w-auto md:min-w-[200px] float-right py-2.5 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40"
        >
          {isSubmitting ? (
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
              Saving...
            </span>
          ) : (
            'Save Product'
          )}
        </button>
      </div>
    </form>
  )
}
