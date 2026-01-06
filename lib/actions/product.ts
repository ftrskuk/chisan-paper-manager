'use server'

import { createClient } from '@/utils/supabase/server'
import { requireAdmin, getUser } from '@/lib/auth'
import {
  productFormSchema,
  categoryFormSchema,
  type ProductFormData,
  type CategoryFormData,
} from '@/lib/validations/product'
import { buildSpecsForInsert } from '@/utils/product-helpers'
import { revalidatePath } from 'next/cache'
import type { ProductFilters } from '@/types/filters'
import type { ProductSpec } from '@/types/database'

export async function createProduct(data: ProductFormData) {
  await requireAdmin()
  const user = await getUser()
  if (!user) throw new Error('Not authenticated')

  const validated = productFormSchema.parse(data)
  const supabase = await createClient()

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      mill_name: validated.mill_name,
      name: validated.name,
      category_id: validated.category_id || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (productError) {
    throw new Error(productError.message, { cause: productError })
  }

  const specsToInsert = buildSpecsForInsert(product.id, validated.specs)

  const { error: specsError } = await supabase
    .from('product_specs')
    .insert(specsToInsert)

  if (specsError) {
    await supabase.from('products').delete().eq('id', product.id)
    throw new Error(specsError.message, { cause: specsError })
  }

  revalidatePath('/products')
  return product
}

export async function updateProduct(productId: string, data: ProductFormData) {
  await requireAdmin()
  const validated = productFormSchema.parse(data)
  const supabase = await createClient()

  const { error: productError } = await supabase
    .from('products')
    .update({
      mill_name: validated.mill_name,
      name: validated.name,
      category_id: validated.category_id || null,
    })
    .eq('id', productId)

  if (productError) {
    throw new Error(productError.message, { cause: productError })
  }

  await supabase.from('product_specs').delete().eq('product_id', productId)

  const specsToInsert = buildSpecsForInsert(productId, validated.specs)

  const { error: specsError } = await supabase
    .from('product_specs')
    .insert(specsToInsert)

  if (specsError) {
    throw new Error(specsError.message, { cause: specsError })
  }

  revalidatePath('/products')
  revalidatePath(`/products/${productId}`)
}

export async function deleteProduct(productId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.from('products').delete().eq('id', productId)

  if (error) {
    throw new Error(error.message, { cause: error })
  }

  revalidatePath('/products')
}

export async function getProducts(filters?: ProductFilters) {
  const supabase = await createClient()

  let query = supabase.from('products').select(
    `
      *,
      categories (id, name),
      product_specs (*)
    `
  )

  // Apply text search filter on product name and mill name
  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,mill_name.ilike.%${filters.search}%`
    )
  }

  // Apply category filter
  if (filters?.categoryIds && filters.categoryIds.length > 0) {
    query = query.in('category_id', filters.categoryIds)
  }

  // Apply mill name filter
  if (filters?.millNames && filters.millNames.length > 0) {
    query = query.in('mill_name', filters.millNames)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    throw new Error(error.message, { cause: error })
  }

  // Client-side filtering for spec-level properties
  // (Supabase doesn't support filtering on nested relations easily)
  if (!data) return []

  let filteredData = data

  // Filter by spec properties if any spec-level filters are set
  if (hasSpecFilters(filters)) {
    filteredData = data.filter((product) => {
      // Product must have at least one spec that matches all filters
      return product.product_specs.some((spec: ProductSpec) =>
        matchesSpecFilters(spec, filters)
      )
    })

    // Also filter the specs within each product
    filteredData = filteredData.map((product) => ({
      ...product,
      product_specs: product.product_specs.filter((spec: ProductSpec) =>
        matchesSpecFilters(spec, filters)
      ),
    }))
  }

  return filteredData
}

function hasSpecFilters(filters?: ProductFilters): boolean {
  if (!filters) return false
  return !!(
    filters.gsmMin ||
    filters.gsmMax ||
    filters.brightnessMin ||
    filters.brightnessMax ||
    filters.opacityMin ||
    filters.opacityMax ||
    filters.caliperMin ||
    filters.caliperMax ||
    filters.densityMin ||
    filters.densityMax ||
    filters.tensileMdMin ||
    filters.tensileMdMax ||
    filters.tensileCdMin ||
    filters.tensileCdMax ||
    filters.tearMdMin ||
    filters.tearMdMax ||
    filters.tearCdMin ||
    filters.tearCdMax ||
    filters.smoothnessMin ||
    filters.smoothnessMax ||
    filters.cobb60Min ||
    filters.cobb60Max ||
    filters.moistureMin ||
    filters.moistureMax
  )
}

function matchesSpecFilters(
  spec: ProductSpec,
  filters?: ProductFilters
): boolean {
  if (!filters) return true

  // GSM range
  if (filters.gsmMin !== undefined && spec.gsm < filters.gsmMin) return false
  if (filters.gsmMax !== undefined && spec.gsm > filters.gsmMax) return false

  // Brightness range
  if (
    filters.brightnessMin !== undefined &&
    (spec.brightness === null || spec.brightness < filters.brightnessMin)
  )
    return false
  if (
    filters.brightnessMax !== undefined &&
    (spec.brightness === null || spec.brightness > filters.brightnessMax)
  )
    return false

  // Opacity range
  if (
    filters.opacityMin !== undefined &&
    (spec.opacity === null || spec.opacity < filters.opacityMin)
  )
    return false
  if (
    filters.opacityMax !== undefined &&
    (spec.opacity === null || spec.opacity > filters.opacityMax)
  )
    return false

  // Caliper range
  if (
    filters.caliperMin !== undefined &&
    (spec.caliper === null || spec.caliper < filters.caliperMin)
  )
    return false
  if (
    filters.caliperMax !== undefined &&
    (spec.caliper === null || spec.caliper > filters.caliperMax)
  )
    return false

  // Density range
  if (
    filters.densityMin !== undefined &&
    (spec.density === null || spec.density < filters.densityMin)
  )
    return false
  if (
    filters.densityMax !== undefined &&
    (spec.density === null || spec.density > filters.densityMax)
  )
    return false

  // Tensile MD range
  if (
    filters.tensileMdMin !== undefined &&
    (spec.tensile_md === null || spec.tensile_md < filters.tensileMdMin)
  )
    return false
  if (
    filters.tensileMdMax !== undefined &&
    (spec.tensile_md === null || spec.tensile_md > filters.tensileMdMax)
  )
    return false

  // Tensile CD range
  if (
    filters.tensileCdMin !== undefined &&
    (spec.tensile_cd === null || spec.tensile_cd < filters.tensileCdMin)
  )
    return false
  if (
    filters.tensileCdMax !== undefined &&
    (spec.tensile_cd === null || spec.tensile_cd > filters.tensileCdMax)
  )
    return false

  // Tear MD range
  if (
    filters.tearMdMin !== undefined &&
    (spec.tear_md === null || spec.tear_md < filters.tearMdMin)
  )
    return false
  if (
    filters.tearMdMax !== undefined &&
    (spec.tear_md === null || spec.tear_md > filters.tearMdMax)
  )
    return false

  // Tear CD range
  if (
    filters.tearCdMin !== undefined &&
    (spec.tear_cd === null || spec.tear_cd < filters.tearCdMin)
  )
    return false
  if (
    filters.tearCdMax !== undefined &&
    (spec.tear_cd === null || spec.tear_cd > filters.tearCdMax)
  )
    return false

  // Smoothness range
  if (
    filters.smoothnessMin !== undefined &&
    (spec.smoothness === null || spec.smoothness < filters.smoothnessMin)
  )
    return false
  if (
    filters.smoothnessMax !== undefined &&
    (spec.smoothness === null || spec.smoothness > filters.smoothnessMax)
  )
    return false

  // Cobb 60 range
  if (
    filters.cobb60Min !== undefined &&
    (spec.cobb_60 === null || spec.cobb_60 < filters.cobb60Min)
  )
    return false
  if (
    filters.cobb60Max !== undefined &&
    (spec.cobb_60 === null || spec.cobb_60 > filters.cobb60Max)
  )
    return false

  // Moisture range
  if (
    filters.moistureMin !== undefined &&
    (spec.moisture === null || spec.moisture < filters.moistureMin)
  )
    return false
  if (
    filters.moistureMax !== undefined &&
    (spec.moisture === null || spec.moisture > filters.moistureMax)
  )
    return false

  return true
}

export async function createCategory(data: CategoryFormData) {
  await requireAdmin()
  const validated = categoryFormSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase.from('categories').insert(validated)

  if (error) {
    throw new Error(error.message, { cause: error })
  }
  revalidatePath('/categories')
  revalidatePath('/products')
}

export async function updateCategory(id: string, data: CategoryFormData) {
  await requireAdmin()
  const validated = categoryFormSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase
    .from('categories')
    .update(validated)
    .eq('id', id)

  if (error) {
    throw new Error(error.message, { cause: error })
  }
  revalidatePath('/categories')
  revalidatePath('/products')
}

export async function deleteCategory(id: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.from('categories').delete().eq('id', id)

  if (error) {
    throw new Error(error.message, { cause: error })
  }
  revalidatePath('/categories')
  revalidatePath('/products')
}

export async function getProductsByIds(ids: string[]) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      categories (id, name),
      product_specs (*)
    `
    )
    .in('id', ids)

  if (error) throw new Error(error.message, { cause: error })
  return data
}

export async function getProduct(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      categories (id, name),
      product_specs (*)
    `
    )
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message, { cause: error })
  return data
}

export async function getCategories() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw new Error(error.message, { cause: error })
  return data
}

export async function getSpecsByIds(specIds: string[]) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_specs')
    .select(
      `
      *,
      products (
        id,
        mill_name,
        name,
        categories (id, name)
      )
    `
    )
    .in('id', specIds)

  if (error) throw new Error(error.message, { cause: error })
  return data
}

export async function getUniqueMills() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('mill_name')
    .order('mill_name')

  if (error) throw new Error(error.message, { cause: error })

  // Get unique mill names
  const uniqueMills = Array.from(new Set(data?.map((p) => p.mill_name) || []))
  return uniqueMills.sort()
}
