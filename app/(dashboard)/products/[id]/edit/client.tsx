'use client'

import { useRouter } from 'next/navigation'
import { ProductForm } from '@/components/products/product-form'
import { updateProduct } from '@/lib/actions/product'
import type { ProductWithSpecs, Category } from '@/types/database'
import type { ProductFormData } from '@/lib/validations/product'

interface EditProductClientProps {
  product: ProductWithSpecs
  categories: Category[]
}

export function EditProductClient({
  product,
  categories,
}: EditProductClientProps) {
  const router = useRouter()

  const defaultValues: Partial<ProductFormData> = {
    mill_name: product.mill_name,
    name: product.name,
    category_id: product.category_id || undefined,
    specs: product.product_specs.map((spec) => ({
      gsm: spec.gsm,
      caliper: spec.caliper,
      caliper_unit: 'µm',
      tensile_md: spec.tensile_md ?? undefined,
      tensile_cd: spec.tensile_cd ?? undefined,
      tensile_unit: 'kN/m',
      tear_md: spec.tear_md ?? undefined,
      tear_cd: spec.tear_cd ?? undefined,
      tear_unit: 'mN',
      extra_specs: spec.extra_specs as Record<string, unknown>,
    })),
  }

  const handleSubmit = async (data: ProductFormData) => {
    try {
      await updateProduct(product.id, data)
      router.push(`/products/${product.id}`)
    } catch (error) {
      console.error(error)
      alert('Failed to update product')
    }
  }

  return (
    <ProductForm
      categories={categories}
      onSubmit={handleSubmit}
      defaultValues={defaultValues}
    />
  )
}
