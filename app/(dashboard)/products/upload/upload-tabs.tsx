'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ProductForm } from '@/components/products/product-form'
import { TDSUploadClient } from './client'
import { createProduct } from '@/lib/actions/product'
import type { Category } from '@/types/database'
import type { ProductFormData } from '@/lib/validations/product'
import { FileText, PenLine, Sparkles, Upload } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface UploadTabsProps {
  categories: Category[]
}

export function UploadTabs({ categories }: UploadTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeTab = (searchParams.get('tab') as 'manual' | 'pdf') || 'manual'

  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`${pathname}?${params.toString()}`)
  }

  async function handleManualSubmit(data: ProductFormData) {
    try {
      const product = await createProduct(data)
      router.push(`/products/${product.id}`)
    } catch (error) {
      console.error('Failed to create product:', error)
      throw error
    }
  }

  return (
    <Tabs
      defaultValue="manual"
      value={activeTab}
      onValueChange={setActiveTab}
      className="space-y-8"
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <TabsList className="h-auto p-1.5 bg-gray-100/50 backdrop-blur-md border border-gray-200 rounded-full shadow-sm gap-2">
          <TabsTrigger
            value="manual"
            className="group gap-2.5 px-6 py-2.5 rounded-full data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-gray-200 transition-all duration-300 ease-out text-gray-500 hover:text-gray-900 font-medium"
          >
            <PenLine className="w-4 h-4 transition-transform duration-300 group-data-[state=active]:scale-110" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger
            value="pdf"
            className="group gap-2.5 px-6 py-2.5 rounded-full data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-blue-100 transition-all duration-300 ease-out text-gray-500 hover:text-blue-600 font-medium"
          >
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 transition-transform duration-300 group-data-[state=active]:-translate-y-0.5" />
              Upload PDF
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-sm ring-1 ring-blue-500/20">
                AI
                <Sparkles className="w-2.5 h-2.5 opacity-90" />
              </span>
            </div>
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="max-w-4xl mx-auto">
        <TabsContent
          value="manual"
          className="mt-0 focus-visible:outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-500 ease-out"
        >
          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-500">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 opacity-50" />

            <div className="border-b border-gray-100 bg-gray-50/30 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-600 ring-1 ring-gray-50 group-hover:scale-105 transition-transform duration-500">
                  <PenLine className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Manual Specification Entry
                  </h2>
                  <p className="text-sm text-gray-500">
                    Enter product details field by field for precise control.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <ProductForm
                categories={categories}
                onSubmit={handleManualSubmit}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="pdf"
          className="mt-0 focus-visible:outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-500 ease-out"
        >
          <div className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-900/5 hover:shadow-md hover:shadow-blue-900/10 transition-all duration-500">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-400" />

            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] opacity-20 pointer-events-none" />

            <div className="relative border-b border-blue-100/50 bg-blue-50/20 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-blue-100 text-blue-600 ring-1 ring-blue-50 group-hover:scale-105 transition-transform duration-500">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      AI TDS Extraction
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold tracking-wide uppercase border border-blue-200">
                      Beta
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Upload a Technical Data Sheet (PDF) to automatically extract
                    specifications.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative p-8">
              <TDSUploadClient categories={categories} />
            </div>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  )
}
