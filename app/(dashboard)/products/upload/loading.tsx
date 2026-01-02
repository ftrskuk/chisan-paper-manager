import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function TDSUploadLoading() {
  return (
    <div className="max-w-4xl">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
      <div className="h-5 w-96 bg-gray-100 rounded animate-pulse mb-6" />

      <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 mt-4">Loading...</p>
      </div>
    </div>
  )
}
