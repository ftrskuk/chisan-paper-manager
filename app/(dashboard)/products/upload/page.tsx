import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import { getCategories } from '@/lib/actions/product'
import { UploadTabs } from './upload-tabs'

export default async function TDSUploadPage() {
  await requireAdmin()
  const categories = await getCategories()

  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Add New Product
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Choose a method to import or create product specifications.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="h-[500px] animate-pulse bg-gray-50 rounded-xl border border-gray-100" />
        }
      >
        <UploadTabs categories={categories} />
      </Suspense>
    </div>
  )
}
