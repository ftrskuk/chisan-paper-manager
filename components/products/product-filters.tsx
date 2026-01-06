'use client'

import { useState } from 'react'
import type { ProductFilters, FilterOption, RangeFilterState } from '@/types/filters'

interface ProductFiltersProps {
  filters: ProductFilters
  onFiltersChange: (filters: ProductFilters) => void
  categories: FilterOption[]
  mills: FilterOption[]
}

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function FilterSection({ title, children, defaultOpen = false }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="text-gray-500">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  )
}

interface RangeInputProps {
  label: string
  min: string
  max: string
  unit?: string
  onChange: (min: string, max: string) => void
  step?: string
}

function RangeInput({ label, min, max, unit, onChange, step = '1' }: RangeInputProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
        {unit && <span className="text-gray-500 ml-1">({unit})</span>}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Min"
          value={min}
          onChange={(e) => onChange(e.target.value, max)}
          step={step}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-gray-500">-</span>
        <input
          type="number"
          placeholder="Max"
          value={max}
          onChange={(e) => onChange(min, e.target.value)}
          step={step}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}

interface CheckboxGroupProps {
  label: string
  options: FilterOption[]
  selected: string[]
  onChange: (selected: string[]) => void
}

function CheckboxGroup({ label, options, selected, onChange }: CheckboxGroupProps) {
  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-2">{label}</label>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {options.map((option) => (
          <label key={option.value} className="flex items-center">
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={() => toggleOption(option.value)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
            />
            <span className="text-sm text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export function ProductFilters({
  filters,
  onFiltersChange,
  categories,
  mills,
}: ProductFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ProductFilters>(filters)

  const updateFilter = (key: keyof ProductFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
  }

  const updateRangeFilter = (
    minKey: keyof ProductFilters,
    maxKey: keyof ProductFilters,
    minValue: string,
    maxValue: string
  ) => {
    const newFilters = {
      ...localFilters,
      [minKey]: minValue ? parseFloat(minValue) : undefined,
      [maxKey]: maxValue ? parseFloat(maxValue) : undefined,
    }
    setLocalFilters(newFilters)
  }

  const applyFilters = () => {
    onFiltersChange(localFilters)
  }

  const clearFilters = () => {
    const emptyFilters: ProductFilters = {}
    setLocalFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  const hasActiveFilters = Object.keys(localFilters).length > 0

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-0">
        <FilterSection title="Search" defaultOpen={true}>
          <input
            type="text"
            placeholder="Search products..."
            value={localFilters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value || undefined)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FilterSection>

        {categories.length > 0 && (
          <FilterSection title="Category">
            <CheckboxGroup
              label="Select Categories"
              options={categories}
              selected={localFilters.categoryIds || []}
              onChange={(selected) =>
                updateFilter('categoryIds', selected.length > 0 ? selected : undefined)
              }
            />
          </FilterSection>
        )}

        {mills.length > 0 && (
          <FilterSection title="Mill">
            <CheckboxGroup
              label="Select Mills"
              options={mills}
              selected={localFilters.millNames || []}
              onChange={(selected) =>
                updateFilter('millNames', selected.length > 0 ? selected : undefined)
              }
            />
          </FilterSection>
        )}

        <FilterSection title="Physical Properties">
          <RangeInput
            label="GSM"
            unit="g/m²"
            min={localFilters.gsmMin?.toString() || ''}
            max={localFilters.gsmMax?.toString() || ''}
            onChange={(min, max) => updateRangeFilter('gsmMin', 'gsmMax', min, max)}
            step="1"
          />
          <RangeInput
            label="Caliper"
            unit="µm"
            min={localFilters.caliperMin?.toString() || ''}
            max={localFilters.caliperMax?.toString() || ''}
            onChange={(min, max) => updateRangeFilter('caliperMin', 'caliperMax', min, max)}
            step="0.1"
          />
          <RangeInput
            label="Density"
            unit="g/cm³"
            min={localFilters.densityMin?.toString() || ''}
            max={localFilters.densityMax?.toString() || ''}
            onChange={(min, max) => updateRangeFilter('densityMin', 'densityMax', min, max)}
            step="0.01"
          />
        </FilterSection>

        <FilterSection title="Optical Properties">
          <RangeInput
            label="Brightness"
            unit="%"
            min={localFilters.brightnessMin?.toString() || ''}
            max={localFilters.brightnessMax?.toString() || ''}
            onChange={(min, max) => updateRangeFilter('brightnessMin', 'brightnessMax', min, max)}
            step="0.1"
          />
          <RangeInput
            label="Opacity"
            unit="%"
            min={localFilters.opacityMin?.toString() || ''}
            max={localFilters.opacityMax?.toString() || ''}
            onChange={(min, max) => updateRangeFilter('opacityMin', 'opacityMax', min, max)}
            step="0.1"
          />
        </FilterSection>

        <FilterSection title="Strength Properties">
          <RangeInput
            label="Tensile MD"
            unit="kN/m"
            min={localFilters.tensileMdMin?.toString() || ''}
            max={localFilters.tensileMdMax?.toString() || ''}
            onChange={(min, max) => updateRangeFilter('tensileMdMin', 'tensileMdMax', min, max)}
            step="0.1"
          />
          <RangeInput
            label="Tensile CD"
            unit="kN/m"
            min={localFilters.tensileCdMin?.toString() || ''}
            max={localFilters.tensileCdMax?.toString() || ''}
            onChange={(min, max) => updateRangeFilter('tensileCdMin', 'tensileCdMax', min, max)}
            step="0.1"
          />
          <RangeInput
            label="Tear MD"
            unit="mN"
            min={localFilters.tearMdMin?.toString() || ''}
            max={localFilters.tearMdMax?.toString() || ''}
            onChange={(min, max) => updateRangeFilter('tearMdMin', 'tearMdMax', min, max)}
            step="1"
          />
          <RangeInput
            label="Tear CD"
            unit="mN"
            min={localFilters.tearCdMin?.toString() || ''}
            max={localFilters.tearCdMax?.toString() || ''}
            onChange={(min, max) => updateRangeFilter('tearCdMin', 'tearCdMax', min, max)}
            step="1"
          />
        </FilterSection>

        <FilterSection title="Surface Properties">
          <RangeInput
            label="Smoothness"
            min={localFilters.smoothnessMin?.toString() || ''}
            max={localFilters.smoothnessMax?.toString() || ''}
            onChange={(min, max) => updateRangeFilter('smoothnessMin', 'smoothnessMax', min, max)}
            step="0.1"
          />
          <RangeInput
            label="Cobb 60"
            unit="g/m²"
            min={localFilters.cobb60Min?.toString() || ''}
            max={localFilters.cobb60Max?.toString() || ''}
            onChange={(min, max) => updateRangeFilter('cobb60Min', 'cobb60Max', min, max)}
            step="1"
          />
          <RangeInput
            label="Moisture"
            unit="%"
            min={localFilters.moistureMin?.toString() || ''}
            max={localFilters.moistureMax?.toString() || ''}
            onChange={(min, max) => updateRangeFilter('moistureMin', 'moistureMax', min, max)}
            step="0.1"
          />
        </FilterSection>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={applyFilters}
          className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Apply Filters
        </button>
      </div>
    </div>
  )
}
