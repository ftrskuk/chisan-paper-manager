import {
  getProducts,
  getCategories,
  getUniqueMills,
} from '@/lib/actions/product'
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
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No products yet.</p>
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
