export interface SpecInput {
  gsm: number
  caliper?: number
  tensile_md?: number
  tensile_cd?: number
  tear_md?: number
  tear_cd?: number
  smoothness?: number
  stiffness_md?: number
  stiffness_cd?: number
  brightness?: number
  cobb_60?: number
  density?: number
  opacity?: number
  moisture?: number
  extra_specs: Record<string, unknown>
}

export interface SpecForInsert {
  product_id: string
  gsm: number
  caliper: number | null
  tensile_md: number | null
  tensile_cd: number | null
  tear_md: number | null
  tear_cd: number | null
  smoothness: number | null
  stiffness_md: number | null
  stiffness_cd: number | null
  brightness: number | null
  cobb_60: number | null
  density: number | null
  opacity: number | null
  moisture: number | null
  extra_specs: Record<string, unknown>
}

export function buildSpecsForInsert(
  productId: string,
  specs: SpecInput[]
): SpecForInsert[] {
  return specs.map((spec) => ({
    product_id: productId,
    gsm: spec.gsm,
    caliper: spec.caliper ?? null,
    tensile_md: spec.tensile_md ?? null,
    tensile_cd: spec.tensile_cd ?? null,
    tear_md: spec.tear_md ?? null,
    tear_cd: spec.tear_cd ?? null,
    smoothness: spec.smoothness ?? null,
    stiffness_md: spec.stiffness_md ?? null,
    stiffness_cd: spec.stiffness_cd ?? null,
    brightness: spec.brightness ?? null,
    cobb_60: spec.cobb_60 ?? null,
    density: spec.density ?? null,
    opacity: spec.opacity ?? null,
    moisture: spec.moisture ?? null,
    extra_specs: spec.extra_specs,
  }))
}
