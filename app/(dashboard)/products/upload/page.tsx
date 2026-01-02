import { requireAdmin } from '@/lib/auth'
import { getCategories } from '@/lib/actions/product'
import { TDSUploadClient } from './client'

export default async function TDSUploadPage() {
  await requireAdmin()
  const categories = await getCategories()

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">Upload TDS PDF</h1>
      <p className="text-gray-600 mb-6">
        Upload a Technical Data Sheet (TDS) PDF to automatically extract product
        specifications using AI.
      </p>
      <TDSUploadClient categories={categories} />
    </div>
  )
}
