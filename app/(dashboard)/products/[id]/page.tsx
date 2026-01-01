import Link from 'next/link'
import { getProduct } from '@/lib/actions/product'
import { getProfile, isAdmin } from '@/lib/auth'
import { ChevronLeft, Pencil } from 'lucide-react'

export default async function ProductPage({ params }: { params: { id: string } }) {
  const [product, profile] = await Promise.all([
    getProduct(params.id),
    getProfile(),
  ])

  const admin = isAdmin(profile)

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link
          href="/products"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4"
        >
          <ChevronLeft size={16} className="mr-1" />
          Back to Products
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {product.mill_name} <span className="text-gray-400 font-light">|</span> {product.name}
            </h1>
            {product.categories && (
              <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                {product.categories.name}
              </span>
            )}
          </div>
          {admin && (
            <Link
              href={`/products/${product.id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Pencil size={16} />
              Edit Product
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Technical Specifications</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase font-medium text-xs border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 whitespace-nowrap">GSM (g/m²)</th>
                <th className="px-6 py-3 whitespace-nowrap">Caliper (µm)</th>
                <th className="px-6 py-3 whitespace-nowrap">Tensile MD (kN/m)</th>
                <th className="px-6 py-3 whitespace-nowrap">Tensile CD (kN/m)</th>
                <th className="px-6 py-3 whitespace-nowrap">Tear MD (mN)</th>
                <th className="px-6 py-3 whitespace-nowrap">Tear CD (mN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {product.product_specs.sort((a: any, b: any) => a.gsm - b.gsm).map((spec: any) => (
                <tr key={spec.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{spec.gsm}</td>
                  <td className="px-6 py-4 text-gray-600">{spec.caliper}</td>
                  <td className="px-6 py-4 text-gray-600">{spec.tensile_md ?? '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{spec.tensile_cd ?? '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{spec.tear_md ?? '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{spec.tear_cd ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-8 flex justify-center opacity-20">
        <div className="w-16 h-1 bg-gray-900 rounded-full"></div>
      </div>
    </div>
  )
}
