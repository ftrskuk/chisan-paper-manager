import * as z from 'zod'

export const thicknessUnitSchema = z.enum(['µm', 'mm', 'mil', 'inch'])
export const tensileUnitSchema = z.enum(['kN/m', 'kgf/15mm', 'N/15mm', 'lb/in'])
export const tearUnitSchema = z.enum(['mN', 'gf', 'cN'])

export const productSpecSchema = z.object({
  gsm: z.number().positive('GSM must be positive'),
  caliper: z.number().positive('Caliper must be positive'),
  caliper_unit: thicknessUnitSchema,
  tensile_md: z.number().nonnegative('Tensile MD cannot be negative').optional(),
  tensile_cd: z.number().nonnegative('Tensile CD cannot be negative').optional(),
  tensile_unit: tensileUnitSchema,
  tear_md: z.number().nonnegative('Tear MD cannot be negative').optional(),
  tear_cd: z.number().nonnegative('Tear CD cannot be negative').optional(),
  tear_unit: tearUnitSchema,
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

export const tdsSpecSchema = z.object({
  gsm: z.number().positive('GSM must be positive'),
  caliper: z.object({
    value: z.number().positive(),
    unit: z.enum(['µm', 'mm', 'mil']),
  }).optional(),
  tensile_md: z.object({
    value: z.number().nonnegative(),
    unit: z.enum(['kN/m', 'kgf/15mm', 'N/15mm']),
  }).optional(),
  tensile_cd: z.object({
    value: z.number().nonnegative(),
    unit: z.enum(['kN/m', 'kgf/15mm', 'N/15mm']),
  }).optional(),
  tear_md: z.object({
    value: z.number().nonnegative(),
    unit: z.enum(['mN', 'gf']),
  }).optional(),
  tear_cd: z.object({
    value: z.number().nonnegative(),
    unit: z.enum(['mN', 'gf']),
  }).optional(),
  smoothness: z.object({
    value: z.number().positive(),
    unit: smoothnessUnitSchema,
    method: smoothnessMethodSchema,
  }).optional(),
  stiffness_md: z.object({
    value: z.number().nonnegative(),
    unit: stiffnessUnitSchema,
  }).optional(),
  stiffness_cd: z.object({
    value: z.number().nonnegative(),
    unit: stiffnessUnitSchema,
  }).optional(),
  brightness: z.number().min(0).max(100).optional(),
  cobb_60: z.number().nonnegative().optional(),
  density: z.number().positive().optional(),
  opacity: z.number().min(0).max(100).optional(),
  moisture: z.number().min(0).max(100).optional(),
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
