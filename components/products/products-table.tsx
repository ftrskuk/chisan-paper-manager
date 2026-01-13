'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteProduct } from '@/lib/actions/product'
import { SpecDetailSidebar } from './spec-detail-sidebar'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
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
                <Fragment key={product.id}>
                  <tr
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleExpand(product.id)}
                  >
                    <td className="p-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpand(product.id)
                        }}
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
                        onClick={(e) => e.stopPropagation()}
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
                        {isAdmin && (
                          <>
                            <Link
                              href={`/products/${product.id}/edit`}
                              className="text-sm text-blue-600 hover:text-blue-800"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Edit
                            </Link>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(product.id)
                              }}
                              disabled={deleting === product.id}
                              className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-800 disabled:text-gray-400"
                            >
                              {deleting === product.id ? (
                                <>
                                  <span className="grayscale">
                                    <LoadingSpinner size="sm" />
                                  </span>
                                  Deleting...
                                </>
                              ) : (
                                'Delete'
                              )}
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
                                className={`inline-flex items-center rounded border transition-colors overflow-hidden ${
                                  isSpecSelected(spec.id)
                                    ? 'bg-blue-50 border-blue-400'
                                    : 'bg-white border-gray-300 hover:border-gray-400'
                                } ${selectedSpecs.size >= 10 && !isSpecSelected(spec.id) ? 'opacity-50' : ''}`}
                              >
                                <label className="flex items-center px-3 py-1.5 cursor-pointer hover:bg-gray-100 border-r border-gray-200">
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
                                    className="cursor-pointer mr-2"
                                  />
                                  <span className="text-sm font-medium text-gray-700">
                                    {spec.gsm}g
                                  </span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => openSidebar(product, spec)}
                                  className="px-2 py-1.5 hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                                  title="View Details"
                                >
                                  <span className="sr-only">View Details</span>
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                </button>
                              </div>
                            ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
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
