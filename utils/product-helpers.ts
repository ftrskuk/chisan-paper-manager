export interface SpecInput {
  gsm: number
  caliper: number
  tensile_md?: number
  tensile_cd?: number
  tear_md?: number
  tear_cd?: number
  extra_specs: Record<string, unknown>
}

export interface SpecForInsert {
  product_id: string
  gsm: number
  caliper: number
  tensile_md: number | null
  tensile_cd: number | null
  tear_md: number | null
  tear_cd: number | null
  extra_specs: Record<string, unknown>
}

export function buildSpecsForInsert(
  productId: string,
  specs: SpecInput[]
): SpecForInsert[] {
  return specs.map((spec) => ({
    product_id: productId,
    gsm: spec.gsm,
    caliper: spec.caliper,
    tensile_md: spec.tensile_md ?? null,
    tensile_cd: spec.tensile_cd ?? null,
    tear_md: spec.tear_md ?? null,
    tear_cd: spec.tear_cd ?? null,
    extra_specs: spec.extra_specs,
  }))
}
