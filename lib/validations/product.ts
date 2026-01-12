import * as z from 'zod'

// Unit schemas - used for TDS parsing (AI extracts various units)
export const thicknessUnitSchema = z.enum(['µm', 'mm', 'mil', 'inch'])
export const tensileUnitSchema = z.enum(['kN/m', 'kgf/15mm', 'N/15mm', 'lb/in'])
export const tearUnitSchema = z.enum(['mN', 'gf', 'cN'])

// Product spec schema for manual input - values in STANDARD UNITS only
// Standard units: caliper=µm, tensile=kN/m, tear=mN
export const productSpecSchema = z.object({
  gsm: z.number().positive('GSM must be positive'),
  caliper: z.number().positive('Caliper must be positive').optional(),
  tensile_md: z.number().nonnegative().optional(),
  tensile_cd: z.number().nonnegative().optional(),
  tear_md: z.number().nonnegative().optional(),
  tear_cd: z.number().nonnegative().optional(),
  smoothness: z.number().nonnegative().optional(),
  stiffness_md: z.number().nonnegative().optional(),
  stiffness_cd: z.number().nonnegative().optional(),
  brightness: z.number().min(0).max(100).optional(),
  cobb_60: z.number().nonnegative().optional(),
  density: z.number().positive().optional(),
  opacity: z.number().min(0).max(100).optional(),
  moisture: z.number().min(0).max(100).optional(),
  extra_specs: z.record(z.unknown()),
})

export const productFormSchema = z.object({
  mill_name: z.string().trim().min(1, 'Mill name is required'),
  name: z.string().trim().min(1, 'Product name is required'),
  category_id: z.string().uuid().optional(),
  specs: z.array(productSpecSchema).min(1, 'At least one spec is required'),
})

export type ProductSpecFormData = z.infer<typeof productSpecSchema>
export type ProductFormData = z.infer<typeof productFormSchema>

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Category name is required'),
  description: z.string().trim().optional(),
})

export type CategoryFormData = z.infer<typeof categoryFormSchema>

export const smoothnessUnitSchema = z.enum(['sec', 'ml/min', 'µm'])
export const smoothnessMethodSchema = z.enum(['Bekk', 'Bendtsen', 'PPS'])
export const stiffnessUnitSchema = z.enum(['mN·m', 'gf·cm', 'mN·mm'])

const valueUnitSchema = <T extends readonly [string, ...string[]]>(units: T) =>
  z
    .object({
      value: z.number().nullable(),
      unit: z.enum(units).nullable(),
    })
    .nullable()
    .optional()

export const tdsSpecSchema = z.object({
  gsm: z.number().positive('GSM must be positive'),
  caliper: valueUnitSchema(['µm', 'mm', 'mil', 'inch'] as const),
  tensile_md: valueUnitSchema(['kN/m', 'kgf/15mm', 'N/15mm', 'lb/in'] as const),
  tensile_cd: valueUnitSchema(['kN/m', 'kgf/15mm', 'N/15mm', 'lb/in'] as const),
  tear_md: valueUnitSchema(['mN', 'gf', 'cN'] as const),
  tear_cd: valueUnitSchema(['mN', 'gf', 'cN'] as const),
  smoothness: z
    .object({
      value: z.number().nullable(),
      unit: smoothnessUnitSchema.nullable(),
      method: smoothnessMethodSchema.nullable(),
    })
    .nullable()
    .optional(),
  stiffness_md: valueUnitSchema(['mN·m', 'gf·cm', 'mN·mm'] as const),
  stiffness_cd: valueUnitSchema(['mN·m', 'gf·cm', 'mN·mm'] as const),
  brightness: z.number().min(0).max(100).nullable().optional(),
  cobb_60: z.number().nonnegative().nullable().optional(),
  density: z.number().positive().nullable().optional(),
  opacity: z.number().min(0).max(100).nullable().optional(),
  moisture: z.number().min(0).max(100).nullable().optional(),
  extra_specs: z.record(z.unknown()).optional(),
})

export const tdsProductFormSchema = z.object({
  mill_name: z.string().trim().min(1, 'Mill name is required'),
  product_name: z.string().trim().min(1, 'Product name is required'),
  category_id: z.string().uuid().optional(),
  file_url: z.string().min(1, 'PDF file is required'),
  specs: z.array(tdsSpecSchema).min(1, 'At least one spec is required'),
})

export type TDSSpecFormData = z.infer<typeof tdsSpecSchema>
export type TDSProductFormData = z.infer<typeof tdsProductFormSchema>
