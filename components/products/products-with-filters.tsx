'use client'

import { useState } from 'react'
import { ProductsTable } from './products-table'
import { ProductToolbar } from './product-toolbar'
import type {
  ProductFilters as ProductFiltersType,
  FilterOption,
} from '@/types/filters'
import type { ProductSpec, Category } from '@/types/database'

interface ProductWithRelations {
  id: string
  mill_name: string
  name: string
  category_id: string | null
  file_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  categories: Category | null
  product_specs: ProductSpec[]
}

interface ProductsWithFiltersProps {
  initialProducts: ProductWithRelations[]
  categories: FilterOption[]
  mills: FilterOption[]
  isAdmin: boolean
}

export function ProductsWithFilters({
  initialProducts,
  categories,
  mills,
  isAdmin,
}: ProductsWithFiltersProps) {
  const [filters, setFilters] = useState<ProductFiltersType>({})

  // Apply filters to products
  const filteredProducts = applyFiltersToProducts(initialProducts, filters)

  return (
    <div className="space-y-4 lg:space-y-6">
      <ProductToolbar
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
        mills={mills}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
          <span>
            Showing {filteredProducts.length} of {initialProducts.length}{' '}
            products
          </span>
          {Object.keys(filters).filter((k) => k !== 'search').length > 0 && (
            <button
              onClick={() => setFilters({ search: filters.search })}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 lg:py-24 bg-gray-50/50 rounded-lg border border-dashed">
            <h3 className="text-lg font-medium text-gray-900">
              No products found
            </h3>
            <p className="text-gray-500 mt-1 px-4">
              Try adjusting your search or filters to find what you&apos;re
              looking for.
            </p>
            <button
              onClick={() => setFilters({})}
              className="mt-4 text-blue-600 hover:underline font-medium"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <ProductsTable products={filteredProducts} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  )
}

function applyFiltersToProducts(
  products: ProductWithRelations[],
  filters: ProductFiltersType
): ProductWithRelations[] {
  if (Object.keys(filters).length === 0) {
    return products
  }

  let filtered = products

  // Text search
  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.mill_name.toLowerCase().includes(searchLower) ||
        (p.categories?.name &&
          p.categories.name.toLowerCase().includes(searchLower))
    )
  }

  // Category filter
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    filtered = filtered.filter(
      (p) => p.category_id && filters.categoryIds!.includes(p.category_id)
    )
  }

  // Mill filter
  if (filters.millNames && filters.millNames.length > 0) {
    filtered = filtered.filter((p) => filters.millNames!.includes(p.mill_name))
  }

  // Spec-level filters
  if (hasSpecFilters(filters)) {
    filtered = filtered
      .filter((product) => {
        // Product must have at least one spec that matches
        return product.product_specs.some((spec) =>
          matchesSpecFilters(spec, filters)
        )
      })
      .map((product) => ({
        ...product,
        product_specs: product.product_specs.filter((spec) =>
          matchesSpecFilters(spec, filters)
        ),
      }))
  }

  return filtered
}

function hasSpecFilters(filters: ProductFiltersType): boolean {
  return !!(
    filters.gsmMin ||
    filters.gsmMax ||
    filters.brightnessMin ||
    filters.brightnessMax ||
    filters.opacityMin ||
    filters.opacityMax ||
    filters.caliperMin ||
    filters.caliperMax ||
    filters.densityMin ||
    filters.densityMax ||
    filters.tensileMdMin ||
    filters.tensileMdMax ||
    filters.tensileCdMin ||
    filters.tensileCdMax ||
    filters.tearMdMin ||
    filters.tearMdMax ||
    filters.tearCdMin ||
    filters.tearCdMax ||
    filters.smoothnessMin ||
    filters.smoothnessMax ||
    filters.cobb60Min ||
    filters.cobb60Max ||
    filters.moistureMin ||
    filters.moistureMax
  )
}

function matchesSpecFilters(
  spec: ProductSpec,
  filters: ProductFiltersType
): boolean {
  // GSM range
  if (filters.gsmMin !== undefined && spec.gsm < filters.gsmMin) return false
  if (filters.gsmMax !== undefined && spec.gsm > filters.gsmMax) return false

  // Brightness range
  if (
    filters.brightnessMin !== undefined &&
    (spec.brightness === null || spec.brightness < filters.brightnessMin)
  )
    return false
  if (
    filters.brightnessMax !== undefined &&
    (spec.brightness === null || spec.brightness > filters.brightnessMax)
  )
    return false

  // Opacity range
  if (
    filters.opacityMin !== undefined &&
    (spec.opacity === null || spec.opacity < filters.opacityMin)
  )
    return false
  if (
    filters.opacityMax !== undefined &&
    (spec.opacity === null || spec.opacity > filters.opacityMax)
  )
    return false

  // Caliper range
  if (
    filters.caliperMin !== undefined &&
    (spec.caliper === null || spec.caliper < filters.caliperMin)
  )
    return false
  if (
    filters.caliperMax !== undefined &&
    (spec.caliper === null || spec.caliper > filters.caliperMax)
  )
    return false

  // Density range
  if (
    filters.densityMin !== undefined &&
    (spec.density === null || spec.density < filters.densityMin)
  )
    return false
  if (
    filters.densityMax !== undefined &&
    (spec.density === null || spec.density > filters.densityMax)
  )
    return false

  // Tensile MD range
  if (
    filters.tensileMdMin !== undefined &&
    (spec.tensile_md === null || spec.tensile_md < filters.tensileMdMin)
  )
    return false
  if (
    filters.tensileMdMax !== undefined &&
    (spec.tensile_md === null || spec.tensile_md > filters.tensileMdMax)
  )
    return false

  // Tensile CD range
  if (
    filters.tensileCdMin !== undefined &&
    (spec.tensile_cd === null || spec.tensile_cd < filters.tensileCdMin)
  )
    return false
  if (
    filters.tensileCdMax !== undefined &&
    (spec.tensile_cd === null || spec.tensile_cd > filters.tensileCdMax)
  )
    return false

  // Tear MD range
  if (
    filters.tearMdMin !== undefined &&
    (spec.tear_md === null || spec.tear_md < filters.tearMdMin)
  )
    return false
  if (
    filters.tearMdMax !== undefined &&
    (spec.tear_md === null || spec.tear_md > filters.tearMdMax)
  )
    return false

  // Tear CD range
  if (
    filters.tearCdMin !== undefined &&
    (spec.tear_cd === null || spec.tear_cd < filters.tearCdMin)
  )
    return false
  if (
    filters.tearCdMax !== undefined &&
    (spec.tear_cd === null || spec.tear_cd > filters.tearCdMax)
  )
    return false

  // Smoothness range
  if (
    filters.smoothnessMin !== undefined &&
    (spec.smoothness === null || spec.smoothness < filters.smoothnessMin)
  )
    return false
  if (
    filters.smoothnessMax !== undefined &&
    (spec.smoothness === null || spec.smoothness > filters.smoothnessMax)
  )
    return false

  // Cobb 60 range
  if (
    filters.cobb60Min !== undefined &&
    (spec.cobb_60 === null || spec.cobb_60 < filters.cobb60Min)
  )
    return false
  if (
    filters.cobb60Max !== undefined &&
    (spec.cobb_60 === null || spec.cobb_60 > filters.cobb60Max)
  )
    return false

  // Moisture range
  if (
    filters.moistureMin !== undefined &&
    (spec.moisture === null || spec.moisture < filters.moistureMin)
  )
    return false
  if (
    filters.moistureMax !== undefined &&
    (spec.moisture === null || spec.moisture > filters.moistureMax)
  )
    return false

  return true
}
