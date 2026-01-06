'use client'

import { useState } from 'react'

interface SpecWithProduct {
  id: string
  gsm: number
  caliper: number
  tensile_md: number | null
  tensile_cd: number | null
  tear_md: number | null
  tear_cd: number | null
  smoothness: number | null
  smoothness_unit: string | null
  stiffness_md: number | null
  stiffness_cd: number | null
  brightness: number | null
  cobb_60: number | null
  density: number | null
  opacity: number | null
  moisture: number | null
  extra_specs: Record<string, unknown>
  products: {
    id: string
    mill_name: string
    name: string
    categories?: { id: string; name: string } | null
  } | null
}

interface ComparisonChartsProps {
  specs: SpecWithProduct[]
}

const PRODUCT_COLORS = [
  {
    bg: 'bg-blue-500',
    text: 'text-blue-600',
    light: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    bg: 'bg-green-500',
    text: 'text-green-600',
    light: 'bg-green-50',
    border: 'border-green-200',
  },
  {
    bg: 'bg-orange-500',
    text: 'text-orange-600',
    light: 'bg-orange-50',
    border: 'border-orange-200',
  },
  {
    bg: 'bg-purple-500',
    text: 'text-purple-600',
    light: 'bg-purple-50',
    border: 'border-purple-200',
  },
  {
    bg: 'bg-pink-500',
    text: 'text-pink-600',
    light: 'bg-pink-50',
    border: 'border-pink-200',
  },
  {
    bg: 'bg-indigo-500',
    text: 'text-indigo-600',
    light: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
  {
    bg: 'bg-teal-500',
    text: 'text-teal-600',
    light: 'bg-teal-50',
    border: 'border-teal-200',
  },
  {
    bg: 'bg-rose-500',
    text: 'text-rose-600',
    light: 'bg-rose-50',
    border: 'border-rose-200',
  },
  {
    bg: 'bg-amber-500',
    text: 'text-amber-600',
    light: 'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    bg: 'bg-cyan-500',
    text: 'text-cyan-600',
    light: 'bg-cyan-50',
    border: 'border-cyan-200',
  },
]

interface PropertyRowProps {
  label: string
  unit: string
  value: number | null
  maxValue: number
  color: string
  isPercentage?: boolean
}

function PropertyRow({
  label,
  unit,
  value,
  maxValue,
  color,
  isPercentage = false,
}: PropertyRowProps) {
  const displayValue = value ?? 0
  const percentage = maxValue > 0 ? (displayValue / maxValue) * 100 : 0
  const formattedValue = isPercentage
    ? displayValue.toFixed(1)
    : displayValue.toFixed(2)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label} <span className="text-xs text-slate-400">({unit})</span>
        </span>
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          {value === null ? 'N/A' : formattedValue}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function ComparisonCharts({ specs }: ComparisonChartsProps) {
  const [overlayMode, setOverlayMode] = useState(false)
  const [selectedProperties, setSelectedProperties] = useState<
    Record<string, boolean>
  >({})

  const maxGsm = Math.max(...specs.map((s) => s.gsm), 1)
  const maxCaliper = Math.max(...specs.map((s) => s.caliper), 1)
  const maxTensileMd = Math.max(...specs.map((s) => s.tensile_md ?? 0), 1)
  const maxTensileCd = Math.max(...specs.map((s) => s.tensile_cd ?? 0), 1)
  const maxTearMd = Math.max(...specs.map((s) => s.tear_md ?? 0), 1)
  const maxTearCd = Math.max(...specs.map((s) => s.tear_cd ?? 0), 1)
  const maxStiffnessMd = Math.max(...specs.map((s) => s.stiffness_md ?? 0), 1)
  const maxStiffnessCd = Math.max(...specs.map((s) => s.stiffness_cd ?? 0), 1)
  const maxBrightness = Math.max(...specs.map((s) => s.brightness ?? 0), 1)
  const maxOpacity = Math.max(...specs.map((s) => s.opacity ?? 0), 1)
  const maxSmoothness = Math.max(...specs.map((s) => s.smoothness ?? 0), 1)
  const maxCobb = Math.max(...specs.map((s) => s.cobb_60 ?? 0), 1)
  const maxMoisture = Math.max(...specs.map((s) => s.moisture ?? 0), 1)
  const maxDensity = Math.max(...specs.map((s) => s.density ?? 0), 1)

  const toggleProperty = (key: string) => {
    if (overlayMode) {
      setSelectedProperties((prev) => ({ ...prev, [key]: !prev[key] }))
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 shadow-sm gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Overlay Charts
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Click bars to overlay selected properties
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            setOverlayMode(!overlayMode)
            if (overlayMode) setSelectedProperties({})
          }}
          className={`relative flex h-[28px] w-[48px] cursor-pointer items-center rounded-full border-none p-0.5 transition-colors duration-200 ${
            overlayMode
              ? 'bg-primary justify-end'
              : 'bg-slate-200 dark:bg-slate-700 justify-start'
          }`}
        >
          <div className="h-[24px] w-[24px] rounded-full bg-white shadow-sm transition-all" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {specs.map((spec, index) => {
          const color = PRODUCT_COLORS[index % PRODUCT_COLORS.length]
          const isSelected = (key: string) =>
            selectedProperties[key] && overlayMode

          return (
            <div
              key={spec.id}
              className={`flex flex-col rounded-xl border bg-white dark:bg-slate-850 shadow-sm overflow-hidden ${
                overlayMode
                  ? 'border-slate-200 dark:border-slate-700'
                  : color.border
              }`}
            >
              <div
                className={`p-4 border-b ${overlayMode ? 'border-slate-200 dark:border-slate-700' : color.border} flex flex-col gap-2 relative`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`size-6 rounded-full ${color.bg} flex items-center justify-center text-white text-xs font-bold`}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {spec.products?.name || 'Unknown Product'}
                  </h3>
                </div>
                <p className={`text-sm ${color.text} font-medium`}>
                  {spec.products?.mill_name || 'Unknown Mill'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {spec.products?.categories?.name || 'Specialty'} • {spec.gsm}{' '}
                  gsm
                </p>
                {!overlayMode && (
                  <div
                    className={`absolute top-4 right-4 ${color.light} ${color.text} text-xs px-2 py-1 rounded font-semibold`}
                  >
                    Option {String.fromCharCode(65 + index)}
                  </div>
                )}
              </div>

              <div className="p-4 flex flex-col gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Physical Properties
                  </span>
                  <div className="flex flex-col gap-3 mt-3">
                    <PropertyRow
                      label="GSM"
                      unit="g/m²"
                      value={spec.gsm}
                      maxValue={maxGsm}
                      color={isSelected('gsm') ? 'bg-primary' : color.bg}
                    />
                    <PropertyRow
                      label="Caliper"
                      unit="µm"
                      value={spec.caliper}
                      maxValue={maxCaliper}
                      color={isSelected('caliper') ? 'bg-primary' : color.bg}
                    />
                    <PropertyRow
                      label="Density"
                      unit="g/cm³"
                      value={spec.density}
                      maxValue={maxDensity}
                      color={isSelected('density') ? 'bg-primary' : color.bg}
                    />
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Surface Properties
                  </span>
                  <div className="flex flex-col gap-3 mt-3">
                    <PropertyRow
                      label="Brightness"
                      unit="%"
                      value={spec.brightness}
                      maxValue={maxBrightness}
                      isPercentage
                      color={isSelected('brightness') ? 'bg-primary' : color.bg}
                    />
                    <PropertyRow
                      label="Opacity"
                      unit="%"
                      value={spec.opacity}
                      maxValue={maxOpacity}
                      isPercentage
                      color={isSelected('opacity') ? 'bg-primary' : color.bg}
                    />
                    <PropertyRow
                      label="Smoothness"
                      unit={`${spec.smoothness_unit || 'sec'}`}
                      value={spec.smoothness}
                      maxValue={maxSmoothness}
                      color={isSelected('smoothness') ? 'bg-primary' : color.bg}
                    />
                    <PropertyRow
                      label="Cobb 60"
                      unit="g/m²"
                      value={spec.cobb_60}
                      maxValue={maxCobb}
                      color={isSelected('cobb') ? 'bg-primary' : color.bg}
                    />
                    <PropertyRow
                      label="Moisture"
                      unit="%"
                      value={spec.moisture}
                      maxValue={maxMoisture}
                      isPercentage
                      color={isSelected('moisture') ? 'bg-primary' : color.bg}
                    />
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Strength Properties
                  </span>
                  <div className="flex flex-col gap-3 mt-3">
                    <PropertyRow
                      label="Tensile MD"
                      unit="kN/m"
                      value={spec.tensile_md}
                      maxValue={maxTensileMd}
                      color={isSelected('tensile_md') ? 'bg-primary' : color.bg}
                    />
                    <PropertyRow
                      label="Tensile CD"
                      unit="kN/m"
                      value={spec.tensile_cd}
                      maxValue={maxTensileCd}
                      color={isSelected('tensile_cd') ? 'bg-primary' : color.bg}
                    />
                    <PropertyRow
                      label="Tear MD"
                      unit="mN"
                      value={spec.tear_md}
                      maxValue={maxTearMd}
                      color={isSelected('tear_md') ? 'bg-primary' : color.bg}
                    />
                    <PropertyRow
                      label="Tear CD"
                      unit="mN"
                      value={spec.tear_cd}
                      maxValue={maxTearCd}
                      color={isSelected('tear_cd') ? 'bg-primary' : color.bg}
                    />
                    <PropertyRow
                      label="Stiffness MD"
                      unit="mN·m"
                      value={spec.stiffness_md}
                      maxValue={maxStiffnessMd}
                      color={
                        isSelected('stiffness_md') ? 'bg-primary' : color.bg
                      }
                    />
                    <PropertyRow
                      label="Stiffness CD"
                      unit="mN·m"
                      value={spec.stiffness_cd}
                      maxValue={maxStiffnessCd}
                      color={
                        isSelected('stiffness_cd') ? 'bg-primary' : color.bg
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
