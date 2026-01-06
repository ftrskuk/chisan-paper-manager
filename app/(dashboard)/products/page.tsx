import Link from 'next/link'
import { getProducts, getCategories, getUniqueMills } from '@/lib/actions/product'
import { getProfile, isAdmin } from '@/lib/auth'
import { ProductsWithFilters } from '@/components/products/products-with-filters'

export default async function ProductsPage() {
  const [products, categories, mills, profile] = await Promise.all([
    getProducts(),
    getCategories(),
    getUniqueMills(),
    getProfile(),
  ])

  const admin = isAdmin(profile)

  // Prepare filter options
  const categoryOptions = categories.map((cat) => ({
    label: cat.name,
    value: cat.id,
  }))

  const millOptions = mills.map((mill) => ({
    label: mill,
    value: mill,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        {admin && (
          <div className="flex gap-2">
            <Link
              href="/products/upload"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Upload TDS
            </Link>
            <Link
              href="/products/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Product
            </Link>
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No products yet.</p>
          {admin && (
            <Link
              href="/products/new"
              className="text-blue-600 hover:underline"
            >
              Add your first product
            </Link>
          )}
        </div>
      ) : (
        <ProductsWithFilters
          initialProducts={products}
          categories={categoryOptions}
          mills={millOptions}
          isAdmin={admin}
        />
      )}
    </div>
  )
}
