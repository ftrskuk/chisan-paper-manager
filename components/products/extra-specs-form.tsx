'use client'

type ExtraSpecEntry = { key: string; value: string }

interface ExtraSpecsFormProps {
  extraSpecs: ExtraSpecEntry[]
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: (index: number, field: 'key' | 'value', value: string) => void
}

export function ExtraSpecsForm({
  extraSpecs,
  onAdd,
  onRemove,
  onUpdate,
}: ExtraSpecsFormProps) {
  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Extra Specifications
        </label>
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
        >
          + Add Custom Field
        </button>
      </div>

      {extraSpecs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {extraSpecs.map((extra, index) => (
            <div
              key={index}
              className="flex gap-0 shadow-sm rounded-md group hover:shadow-md transition-shadow"
            >
              <input
                type="text"
                placeholder="Key (e.g., moisture)"
                value={extra.key}
                onChange={(e) => onUpdate(index, 'key', e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 bg-gray-50 font-medium text-gray-700 placeholder-gray-400"
              />
              <input
                type="text"
                placeholder="Value (e.g., 7%)"
                value={extra.value}
                onChange={(e) => onUpdate(index, 'value', e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 text-sm border-l-0 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 bg-white placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="px-3 py-2 text-gray-400 hover:text-red-600 border border-l-0 border-gray-300 rounded-r-md hover:bg-red-50 transition-colors focus:z-10 bg-white"
                title="Remove field"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-sm text-gray-500">
            No extra specifications added yet.
          </p>
        </div>
      )}
    </div>
  )
}
