import { getCategories } from '@/lib/actions/product'
import { getProfile, isAdmin } from '@/lib/auth'
import { CategoriesManager } from '@/components/categories/categories-manager'

export default async function CategoriesPage() {
  const [categories, profile] = await Promise.all([
    getCategories(),
    getProfile(),
  ])

  const admin = isAdmin(profile)

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <CategoriesManager categories={categories} isAdmin={admin} />
    </div>
  )
}
