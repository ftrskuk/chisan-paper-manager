'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteProduct } from '@/lib/actions/product'
import { SpecDetailSidebar } from './spec-detail-sidebar'
import type { ProductWithSpecs, Category, ProductSpec } from '@/types/database'

interface ProductWithRelations extends ProductWithSpecs {
  categories: Category | null
  product_specs: ProductSpec[]
}

type SidebarData = {
  spec: ProductSpec
  product: ProductWithRelations
} | null

interface ProductsTableProps {
  products: ProductWithRelations[]
  isAdmin: boolean
}

type SelectedSpec = {
  productId: string
  specId: string
  gsm: number
  label: string
}

export function ProductsTable({ products, isAdmin }: ProductsTableProps) {
  const router = useRouter()
  const [selectedSpecs, setSelectedSpecs] = useState<Map<string, SelectedSpec>>(
    new Map()
  )
  const [expandedProductId, setExpandedProductId] = useState<string | null>(
    null
  )
  const [deleting, setDeleting] = useState<string | null>(null)
  const [sidebarData, setSidebarData] = useState<SidebarData>(null)

  const openSidebar = (product: ProductWithRelations, spec: ProductSpec) => {
    setSidebarData({ product, spec })
  }

  const closeSidebar = () => {
    setSidebarData(null)
  }

  const handleSidebarToggleSelect = () => {
    if (!sidebarData) return
    toggleSpecSelection(sidebarData.product, sidebarData.spec)
  }

  const toggleExpand = (productId: string) => {
    setExpandedProductId((prev) => (prev === productId ? null : productId))
  }

  const toggleSpecSelection = (
    product: ProductWithRelations,
    spec: ProductSpec
  ) => {
    const key = spec.id
    const newSelected = new Map(selectedSpecs)

    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else if (newSelected.size < 10) {
      newSelected.set(key, {
        productId: product.id,
        specId: spec.id,
        gsm: spec.gsm,
        label: `${product.mill_name} ${product.name} ${spec.gsm}g`,
      })
    }
    setSelectedSpecs(newSelected)
  }

  const isSpecSelected = (specId: string) => selectedSpecs.has(specId)

  const getSelectedCountForProduct = (productId: string) => {
    return Array.from(selectedSpecs.values()).filter(
      (s) => s.productId === productId
    ).length
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    setDeleting(id)
    try {
      await deleteProduct(id)
      router.refresh()
    } catch {
      alert('Failed to delete product')
    } finally {
      setDeleting(null)
    }
  }

  const handleCompare = () => {
    if (selectedSpecs.size < 2) {
      alert('Select at least 2 specs to compare')
      return
    }
    const specIds = Array.from(selectedSpecs.keys()).join(',')
    router.push(`/products/compare?spec_ids=${specIds}`)
  }

  const clearSelection = () => {
    setSelectedSpecs(new Map())
    setExpandedProductId(null)
  }

  const getGsmRange = (specs: ProductSpec[]) => {
    if (!specs.length) return '-'
    const gsms = specs.map((s) => s.gsm).sort((a, b) => a - b)
    if (gsms.length === 1) return `${gsms[0]}g`
    return `${gsms[0]} - ${gsms[gsms.length - 1]}g`
  }

  return (
    <div>
      {selectedSpecs.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-800 font-medium">
              {selectedSpecs.size} spec{selectedSpecs.size > 1 ? 's' : ''}{' '}
              selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
              >
                Clear
              </button>
              <button
                onClick={handleCompare}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                Compare Selected
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {Array.from(selectedSpecs.values()).map((spec) => (
              <span
                key={spec.specId}
                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
              >
                {spec.label}
                <button
                  onClick={() => {
                    const newSelected = new Map(selectedSpecs)
                    newSelected.delete(spec.specId)
                    setSelectedSpecs(newSelected)
                  }}
                  className="ml-1 hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3 text-left w-10">
                <span className="sr-only">Expand</span>
              </th>
              <th className="p-3 text-left">Mill</th>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">GSM Range</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const selectedCount = getSelectedCountForProduct(product.id)
              const isExpanded = expandedProductId === product.id

              return (
                <>
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <button
                        onClick={() => toggleExpand(product.id)}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded"
                        title="Select GSM to compare"
                      >
                        {isExpanded ? '▼' : '▶'}
                      </button>
                    </td>
                    <td className="p-3 font-medium">{product.mill_name}</td>
                    <td className="p-3">
                      <Link
                        href={`/products/${product.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {product.name}
                      </Link>
                      {selectedCount > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          {selectedCount} selected
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-gray-600">
                      {product.categories?.name || '-'}
                    </td>
                    <td className="p-3 text-gray-600">
                      {getGsmRange(product.product_specs)}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/products/${product.id}`}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          View
                        </Link>
                        {isAdmin && (
                          <>
                            <Link
                              href={`/products/${product.id}/edit`}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(product.id)}
                              disabled={deleting === product.id}
                              className="text-sm text-red-600 hover:text-red-800 disabled:text-gray-400"
                            >
                              {deleting === product.id
                                ? 'Deleting...'
                                : 'Delete'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${product.id}-specs`} className="bg-gray-50">
                      <td colSpan={6} className="p-3 pl-12">
                        <div className="text-sm text-gray-600 mb-2">
                          Select GSM to compare:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {product.product_specs
                            .sort((a, b) => a.gsm - b.gsm)
                            .map((spec) => (
                              <div
                                key={spec.id}
                                className={`inline-flex items-center px-3 py-1.5 rounded border transition-colors ${
                                  isSpecSelected(spec.id)
                                    ? 'bg-blue-100 border-blue-400 text-blue-800'
                                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                                } ${selectedSpecs.size >= 10 && !isSpecSelected(spec.id) ? 'opacity-50' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSpecSelected(spec.id)}
                                  onChange={() =>
                                    toggleSpecSelection(product, spec)
                                  }
                                  disabled={
                                    selectedSpecs.size >= 10 &&
                                    !isSpecSelected(spec.id)
                                  }
                                  className="mr-2 cursor-pointer"
                                />
                                <button
                                  type="button"
                                  onClick={() => openSidebar(product, spec)}
                                  className="hover:underline cursor-pointer"
                                >
                                  {spec.gsm}g
                                </button>
                              </div>
                            ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      <SpecDetailSidebar
        spec={sidebarData?.spec ?? null}
        product={sidebarData?.product ?? null}
        isOpen={sidebarData !== null}
        onClose={closeSidebar}
        isSelected={sidebarData ? isSpecSelected(sidebarData.spec.id) : false}
        onToggleSelect={handleSidebarToggleSelect}
      />
    </div>
  )
}
