import { getProduct, getCategories } from '@/lib/actions/product'
import { requireAdmin } from '@/lib/auth'
import { EditProductClient } from './client'

export default async function EditProductPage({
  params,
}: {
  params: { id: string }
}) {
  await requireAdmin()

  const [product, categories] = await Promise.all([
    getProduct(params.id),
    getCategories(),
  ])

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
      <EditProductClient product={product} categories={categories} />
    </div>
  )
}
