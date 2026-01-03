'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import type { ProductSpec, Product, Category } from '@/types/database'

interface ProductWithCategory extends Product {
  categories: Category | null
}

interface SpecDetailSidebarProps {
  spec: ProductSpec | null
  product: ProductWithCategory | null
  isOpen: boolean
  onClose: () => void
  isSelected: boolean
  onToggleSelect: () => void
}

interface SpecRowProps {
  label: string
  value: string | number | null | undefined
  unit?: string
}

function SpecRow({ label, value, unit }: SpecRowProps) {
  if (value === null || value === undefined) return null

  return (
    <div className="flex justify-between py-2 border-b border-gray-100">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">
        {value}
        {unit && <span className="text-gray-500 ml-1">{unit}</span>}
      </span>
    </div>
  )
}

export function SpecDetailSidebar({
  spec,
  product,
  isOpen,
  onClose,
  isSelected,
  onToggleSelect,
}: SpecDetailSidebarProps) {
  if (!spec || !product) return null

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[450px] overflow-y-auto"
      >
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-xl">
            {product.mill_name} {product.name}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            {product.categories && (
              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                {product.categories.name}
              </span>
            )}
            <span className="text-blue-600 font-medium">{spec.gsm}g/m²</span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Basic Properties
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <SpecRow label="GSM" value={spec.gsm} unit="g/m²" />
            <SpecRow label="Caliper" value={spec.caliper} unit="µm" />
            <SpecRow label="Density" value={spec.density} unit="g/cm³" />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Strength Properties
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <SpecRow label="Tensile MD" value={spec.tensile_md} unit="kN/m" />
            <SpecRow label="Tensile CD" value={spec.tensile_cd} unit="kN/m" />
            <SpecRow label="Tear MD" value={spec.tear_md} unit="mN" />
            <SpecRow label="Tear CD" value={spec.tear_cd} unit="mN" />
            <SpecRow
              label="Stiffness MD"
              value={spec.stiffness_md}
              unit="mN·m"
            />
            <SpecRow
              label="Stiffness CD"
              value={spec.stiffness_cd}
              unit="mN·m"
            />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Surface & Optical
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <SpecRow label="Brightness" value={spec.brightness} unit="%" />
            <SpecRow label="Opacity" value={spec.opacity} unit="%" />
            <SpecRow
              label="Smoothness"
              value={spec.smoothness}
              unit={spec.smoothness_unit || ''}
            />
            <SpecRow label="Cobb 60" value={spec.cobb_60} unit="g/m²" />
            <SpecRow label="Moisture" value={spec.moisture} unit="%" />
          </div>
        </div>

        {spec.extra_specs && Object.keys(spec.extra_specs).length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Additional Specs
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              {Object.entries(spec.extra_specs).map(([key, value]) => (
                <SpecRow key={key} label={key} value={String(value)} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t">
          <button
            onClick={onToggleSelect}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isSelected
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSelected ? 'Remove from Compare List' : 'Add to Compare List'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
