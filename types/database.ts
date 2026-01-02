export type Role = 'admin' | 'viewer'

export interface Profile {
  id: string
  role: Role
  email: string | null
  full_name: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface Product {
  id: string
  mill_name: string
  name: string
  category_id: string | null
  file_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ProductWithCategory extends Product {
  categories: Category | null
}

export type SmoothnessUnit = 'sec' | 'ml/min' | 'µm'
export type SmoothnessMethod = 'Bekk' | 'Bendtsen' | 'PPS'
export type StiffnessUnit = 'mN·m' | 'gf·cm' | 'mN·mm'

export interface ProductSpec {
  id: string
  product_id: string
  gsm: number
  caliper: number
  tensile_md: number | null
  tensile_cd: number | null
  tear_md: number | null
  tear_cd: number | null
  smoothness: number | null
  smoothness_unit: SmoothnessUnit | null
  stiffness_md: number | null
  stiffness_cd: number | null
  brightness: number | null
  cobb_60: number | null
  density: number | null
  opacity: number | null
  moisture: number | null
  extra_specs: Record<string, unknown>
  created_at: string
}

export type CategoryHint =
  | 'Kraft'
  | 'Liner'
  | 'Medium'
  | 'UWF'
  | 'Board'
  | 'Specialty'

export interface TDSParsedSpec {
  gsm: number
  caliper?: {
    value: number | null
    unit: 'µm' | 'mm' | 'mil' | null
  } | null
  tensile_md?: {
    value: number | null
    unit: 'kN/m' | 'kgf/15mm' | 'N/15mm' | null
  } | null
  tensile_cd?: {
    value: number | null
    unit: 'kN/m' | 'kgf/15mm' | 'N/15mm' | null
  } | null
  tear_md?: {
    value: number | null
    unit: 'mN' | 'gf' | null
  } | null
  tear_cd?: {
    value: number | null
    unit: 'mN' | 'gf' | null
  } | null
  smoothness?: {
    value: number | null
    unit: SmoothnessUnit | null
    method: SmoothnessMethod | null
  } | null
  stiffness_md?: {
    value: number | null
    unit: StiffnessUnit | null
  } | null
  stiffness_cd?: {
    value: number | null
    unit: StiffnessUnit | null
  } | null
  brightness?: number | null
  cobb_60?: number | null
  density?: number | null
  opacity?: number | null
  moisture?: number | null
  extra_specs?: Record<string, unknown>
}

export interface TDSParseResult {
  mill_name: string
  product_name: string
  category_hint: CategoryHint
  specs: TDSParsedSpec[]
  test_standards?: string[]
  notes?: string
}

export interface ProductWithSpecs extends Product {
  categories: Category | null
  product_specs: ProductSpec[]
}

export type ThicknessUnit = 'µm' | 'mm' | 'mil' | 'inch'
export type TensileUnit = 'kN/m' | 'kgf/15mm' | 'N/15mm' | 'lb/in'
export type TearUnit = 'mN' | 'gf' | 'cN'

export interface ProductFormInput {
  mill_name: string
  name: string
  category_id: string
  specs: ProductSpecFormInput[]
}

export interface ProductSpecFormInput {
  gsm: number
  caliper: number
  caliper_unit: ThicknessUnit
  tensile_md?: number
  tensile_cd?: number
  tensile_unit: TensileUnit
  tear_md?: number
  tear_cd?: number
  tear_unit: TearUnit
  extra_specs: Record<string, unknown>
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'>
        Update: Partial<Omit<Category, 'id' | 'created_at'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Product, 'id' | 'created_at'>>
      }
      product_specs: {
        Row: ProductSpec
        Insert: Omit<ProductSpec, 'id' | 'created_at'>
        Update: Partial<Omit<ProductSpec, 'id' | 'created_at'>>
      }
    }
  }
}
