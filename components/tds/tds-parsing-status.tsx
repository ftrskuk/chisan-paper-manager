'use client'

import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CheckCircle, XCircle, FileSearch, Upload, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ParseStatus = 'idle' | 'uploading' | 'parsing' | 'preview' | 'saving' | 'complete' | 'error'

interface TDSParsingStatusProps {
  status: ParseStatus
  error?: string | null
  onRetry?: () => void
}

const STEPS = [
  { key: 'uploading', label: 'Upload PDF', icon: Upload },
  { key: 'parsing', label: 'AI Parsing', icon: FileSearch },
  { key: 'preview', label: 'Review & Edit', icon: CheckCircle },
  { key: 'saving', label: 'Save Product', icon: Save },
] as const

function getStepStatus(stepKey: string, currentStatus: ParseStatus): 'pending' | 'active' | 'complete' | 'error' {
  const stepOrder = ['uploading', 'parsing', 'preview', 'saving', 'complete']
  const currentIndex = stepOrder.indexOf(currentStatus)
  const stepIndex = stepOrder.indexOf(stepKey)

  if (currentStatus === 'error') {
    if (stepIndex < currentIndex) return 'complete'
    if (stepIndex === currentIndex) return 'error'
    return 'pending'
  }

  if (currentStatus === 'idle') return 'pending'
  if (stepIndex < currentIndex) return 'complete'
  if (stepIndex === currentIndex) return 'active'
  return 'pending'
}

export function TDSParsingStatus({ status, error, onRetry }: TDSParsingStatusProps) {
  if (status === 'idle') return null

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {STEPS.map((step, index) => {
          const stepStatus = getStepStatus(step.key, status)
          const Icon = step.icon

          return (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                    stepStatus === 'pending' && 'bg-gray-100 text-gray-400',
                    stepStatus === 'active' && 'bg-blue-100 text-blue-600',
                    stepStatus === 'complete' && 'bg-green-100 text-green-600',
                    stepStatus === 'error' && 'bg-red-100 text-red-600'
                  )}
                >
                  {stepStatus === 'active' ? (
                    <LoadingSpinner size="sm" />
                  ) : stepStatus === 'error' ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs mt-2 font-medium',
                    stepStatus === 'pending' && 'text-gray-400',
                    stepStatus === 'active' && 'text-blue-600',
                    stepStatus === 'complete' && 'text-green-600',
                    stepStatus === 'error' && 'text-red-600'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-16 h-0.5 mx-2 transition-colors',
                    getStepStatus(STEPS[index + 1].key, status) !== 'pending'
                      ? 'bg-green-300'
                      : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {status === 'complete' && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Product saved successfully!</span>
          </div>
        </div>
      )}

      {status === 'error' && error && (
        <div className="mt-6 text-center">
          <div className="inline-flex flex-col items-center gap-3 text-red-600 bg-red-50 px-6 py-4 rounded-lg">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-sm text-red-700 underline hover:no-underline"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
