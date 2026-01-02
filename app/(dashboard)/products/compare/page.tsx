import Link from 'next/link'
import { getSpecsByIds } from '@/lib/actions/product'
import { ComparisonCharts } from '@/components/products/comparison-charts'

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ spec_ids?: string }>
}) {
  const params = await searchParams
  const specIds = params.spec_ids?.split(',').filter(Boolean) || []

  if (specIds.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">No specs selected</h1>
        <p className="text-gray-500 mb-6">
          Please select product specs to compare from the list.
        </p>
        <Link href="/products" className="text-blue-600 hover:underline">
          Back to Products
        </Link>
      </div>
    )
  }

  const specs = await getSpecsByIds(specIds)

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Link
          href="/products"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4"
        >
          ← Back to Products
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Product Comparison</h1>
        <p className="text-gray-500 mt-2">
          Comparing {specs.length} spec{specs.length !== 1 ? 's' : ''}
        </p>
      </div>

      <ComparisonCharts specs={specs} />
    </div>
  )
}
