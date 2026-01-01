import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { getCategories, createProduct } from '@/lib/actions/product'
import { ProductForm } from '@/components/products/product-form'
import type { ProductFormData } from '@/lib/validations/product'

export default async function NewProductPage() {
  await requireAdmin()
  const categories = await getCategories()

  async function handleSubmit(data: ProductFormData) {
    'use server'
    const product = await createProduct(data)
    redirect(`/products/${product.id}`)
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
      <ProductForm categories={categories} onSubmit={handleSubmit} />
    </div>
  )
}
