import Link from 'next/link'
import { getProducts } from '@/lib/actions/product'
import { getProfile, isAdmin } from '@/lib/auth'
import { ProductsTable } from '@/components/products/products-table'

export default async function ProductsPage() {
  const [products, profile] = await Promise.all([
    getProducts(),
    getProfile(),
  ])

  const admin = isAdmin(profile)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        {admin && (
          <Link
            href="/products/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Product
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No products yet.</p>
          {admin && (
            <Link href="/products/new" className="text-blue-600 hover:underline">
              Add your first product
            </Link>
          )}
        </div>
      ) : (
        <ProductsTable products={products} isAdmin={admin} />
      )}
    </div>
  )
}
