'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

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

const CHART_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f97316',
  '#a855f7',
  '#ec4899',
  '#6366f1',
  '#14b8a6',
  '#f43f5e',
  '#f59e0b',
  '#06b6d4',
]

interface SpecProperty {
  key: keyof SpecWithProduct
  label: string
  unit: string
  category: 'physical' | 'surface' | 'strength'
}

const SPEC_PROPERTIES: SpecProperty[] = [
  { key: 'gsm', label: 'GSM', unit: 'g/m²', category: 'physical' },
  { key: 'caliper', label: 'Caliper', unit: 'µm', category: 'physical' },
  { key: 'density', label: 'Density', unit: 'g/cm³', category: 'physical' },
  { key: 'brightness', label: 'Brightness', unit: '%', category: 'surface' },
  { key: 'opacity', label: 'Opacity', unit: '%', category: 'surface' },
  { key: 'smoothness', label: 'Smoothness', unit: 'sec', category: 'surface' },
  { key: 'cobb_60', label: 'Cobb 60', unit: 'g/m²', category: 'surface' },
  { key: 'moisture', label: 'Moisture', unit: '%', category: 'surface' },
  { key: 'tensile_md', label: 'Tensile MD', unit: 'kN/m', category: 'strength' },
  { key: 'tensile_cd', label: 'Tensile CD', unit: 'kN/m', category: 'strength' },
  { key: 'tear_md', label: 'Tear MD', unit: 'mN', category: 'strength' },
  { key: 'tear_cd', label: 'Tear CD', unit: 'mN', category: 'strength' },
  { key: 'stiffness_md', label: 'Stiffness MD', unit: 'mN·m', category: 'strength' },
  { key: 'stiffness_cd', label: 'Stiffness CD', unit: 'mN·m', category: 'strength' },
]

interface PropertyChartProps {
  specs: SpecWithProduct[]
  property: SpecProperty
}

function PropertyChart({ specs, property }: PropertyChartProps) {
  const data = specs
    .map((spec, index) => {
      const value = spec[property.key]
      const productLabel = spec.products
        ? `${spec.products.mill_name} - ${spec.products.name} (${spec.gsm}gsm)`
        : `Unknown (${spec.gsm}gsm)`

      return {
        name: productLabel,
        value: typeof value === 'number' ? value : null,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }
    })
    .filter((d) => d.value !== null)

  if (data.length === 0) {
    return null
  }

  const chartHeight = Math.max(200, data.length * 50 + 60)

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {property.label}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Unit: {property.unit}
        </p>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={200}
              tick={{ fontSize: 11 }}
              tickFormatter={(value: string) =>
                value.length > 30 ? value.slice(0, 30) + '...' : value
              }
            />
            <Tooltip
              formatter={(value: number) => [
                `${value.toLocaleString()} ${property.unit}`,
                property.label,
              ]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function ComparisonCharts({ specs }: ComparisonChartsProps) {
  const physicalProps = SPEC_PROPERTIES.filter((p) => p.category === 'physical')
  const surfaceProps = SPEC_PROPERTIES.filter((p) => p.category === 'surface')
  const strengthProps = SPEC_PROPERTIES.filter((p) => p.category === 'strength')

  const hasData = (property: SpecProperty) =>
    specs.some((spec) => spec[property.key] !== null)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 shadow-sm">
        {specs.map((spec, index) => {
          const productLabel = spec.products
            ? `${spec.products.mill_name} - ${spec.products.name}`
            : 'Unknown Product'

          return (
            <div key={spec.id} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{
                  backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                }}
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {productLabel} ({spec.gsm}gsm)
              </span>
            </div>
          )
        })}
      </div>

      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Physical Properties
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {physicalProps.filter(hasData).map((prop) => (
            <PropertyChart key={prop.key} specs={specs} property={prop} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Surface Properties
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {surfaceProps.filter(hasData).map((prop) => (
            <PropertyChart key={prop.key} specs={specs} property={prop} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Strength Properties
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {strengthProps.filter(hasData).map((prop) => (
            <PropertyChart key={prop.key} specs={specs} property={prop} />
          ))}
        </div>
      </section>
    </div>
  )
}
