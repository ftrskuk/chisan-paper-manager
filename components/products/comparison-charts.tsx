'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface SpecWithProduct {
  id: string
  gsm: number
  caliper: number
  tensile_md: number | null
  tensile_cd: number | null
  tear_md: number | null
  tear_cd: number | null
  extra_specs: Record<string, unknown>
  products: {
    id: string
    mill_name: string
    name: string
  } | null
}

interface ComparisonChartsProps {
  specs: SpecWithProduct[]
}

export function ComparisonCharts({ specs }: ComparisonChartsProps) {
  const data = specs
    .map((spec) => ({
      name: `${spec.products?.mill_name || ''} ${spec.products?.name || ''} ${spec.gsm}g`,
      gsm: spec.gsm,
      caliper: spec.caliper,
      tensile_md: spec.tensile_md,
      tensile_cd: spec.tensile_cd,
      tear_md: spec.tear_md,
      tear_cd: spec.tear_cd,
    }))
    .sort((a, b) => a.gsm - b.gsm)

  return (
    <div className="space-y-12">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-6">Caliper (µm)</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                textAnchor="middle"
                height={60}
                interval={0}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                label={{ value: 'µm', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend verticalAlign="top" />
              <Bar
                dataKey="caliper"
                name="Caliper"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-6">Tensile Strength (kN/m)</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                textAnchor="middle"
                height={60}
                interval={0}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                label={{ value: 'kN/m', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend verticalAlign="top" />
              <Bar
                dataKey="tensile_md"
                name="MD"
                fill="#059669"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="tensile_cd"
                name="CD"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-6">Tear Strength (mN)</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                textAnchor="middle"
                height={60}
                interval={0}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                label={{ value: 'mN', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend verticalAlign="top" />
              <Bar
                dataKey="tear_md"
                name="MD"
                fill="#7c3aed"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="tear_cd"
                name="CD"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
