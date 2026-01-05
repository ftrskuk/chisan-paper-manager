import { useState } from 'react'
import {
  useForm,
  useFieldArray,
  type Control,
  type UseFormReturn,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  productFormSchema,
  type ProductFormData,
} from '@/lib/validations/product'

interface UseProductFormProps {
  defaultValues?: Partial<ProductFormData>
  onSubmit: (data: ProductFormData) => Promise<void>
}

const defaultSpec = {
  gsm: 100,
  caliper: 150,
  extra_specs: {} as Record<string, unknown>,
}

type ExtraSpecEntry = { key: string; value: string }

export function useProductForm({
  defaultValues,
  onSubmit,
}: UseProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const initialExtraSpecs = (defaultValues?.specs || [defaultSpec]).map(
    (spec) =>
      Object.entries(spec.extra_specs || {}).map(([key, value]) => ({
        key,
        value: String(value),
      }))
  )

  const [extraSpecsPerSpec, setExtraSpecsPerSpec] = useState<
    ExtraSpecEntry[][]
  >(initialExtraSpecs.length > 0 ? initialExtraSpecs : [[]])

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      mill_name: '',
      name: '',
      specs: [defaultSpec],
      ...defaultValues,
    },
  })

  const { control, handleSubmit: hookFormSubmit } = form
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'specs',
  })

  const handleSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true)
    try {
      const dataWithExtraSpecs = {
        ...data,
        specs: data.specs.map((spec, index) => ({
          ...spec,
          extra_specs:
            extraSpecsPerSpec[index]?.reduce(
              (acc, { key, value }) => {
                if (key.trim()) {
                  const numValue = parseFloat(value)
                  acc[key.trim()] = isNaN(numValue) ? value : numValue
                }
                return acc
              },
              {} as Record<string, unknown>
            ) || {},
        })),
      }
      await onSubmit(dataWithExtraSpecs)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddSpec = () => {
    append(defaultSpec)
    setExtraSpecsPerSpec((prev) => [...prev, []])
  }

  const handleRemoveSpec = (index: number) => {
    remove(index)
    setExtraSpecsPerSpec((prev) => prev.filter((_, i) => i !== index))
  }

  const addExtraSpec = (specIndex: number) => {
    setExtraSpecsPerSpec((prev) => {
      const updated = [...prev]
      updated[specIndex] = [
        ...(updated[specIndex] || []),
        { key: '', value: '' },
      ]
      return updated
    })
  }

  const removeExtraSpec = (specIndex: number, extraIndex: number) => {
    setExtraSpecsPerSpec((prev) => {
      const updated = [...prev]
      updated[specIndex] = updated[specIndex].filter((_, i) => i !== extraIndex)
      return updated
    })
  }

  const updateExtraSpec = (
    specIndex: number,
    extraIndex: number,
    field: 'key' | 'value',
    value: string
  ) => {
    setExtraSpecsPerSpec((prev) => {
      const updated = [...prev]
      updated[specIndex] = updated[specIndex].map((entry, i) =>
        i === extraIndex ? { ...entry, [field]: value } : entry
      )
      return updated
    })
  }

  return {
    form,
    fields,
    isSubmitting,
    extraSpecsPerSpec,
    submitHandler: hookFormSubmit(handleSubmit),
    actions: {
      handleAddSpec,
      handleRemoveSpec,
      addExtraSpec,
      removeExtraSpec,
      updateExtraSpec,
    },
  }
}
