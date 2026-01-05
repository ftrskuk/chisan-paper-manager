'use client'

import { useProductForm } from './use-product-form'
import { SpecVariantForm } from './spec-variant-form'
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
