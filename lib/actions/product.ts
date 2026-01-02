'use server'

import { createClient } from '@/utils/supabase/server'
import { requireAdmin, getUser } from '@/lib/auth'
import {
  productFormSchema,
  categoryFormSchema,
  type ProductFormData,
  type CategoryFormData,
} from '@/lib/validations/product'
import {
  convertToMicrometers,
  convertToKNPerMeter,
  convertToMillinewtons,
} from '@/utils/unit-converters'
import { revalidatePath } from 'next/cache'

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

  if (productError) throw new Error(productError.message)

  const specsToInsert = validated.specs.map((spec) => ({
    product_id: product.id,
    gsm: spec.gsm,
    caliper: convertToMicrometers(spec.caliper, spec.caliper_unit),
    tensile_md: spec.tensile_md
      ? convertToKNPerMeter(spec.tensile_md, spec.tensile_unit)
      : null,
    tensile_cd: spec.tensile_cd
      ? convertToKNPerMeter(spec.tensile_cd, spec.tensile_unit)
      : null,
    tear_md: spec.tear_md
      ? convertToMillinewtons(spec.tear_md, spec.tear_unit)
      : null,
    tear_cd: spec.tear_cd
      ? convertToMillinewtons(spec.tear_cd, spec.tear_unit)
      : null,
    extra_specs: spec.extra_specs,
  }))

  const { error: specsError } = await supabase
    .from('product_specs')
    .insert(specsToInsert)

  if (specsError) {
    await supabase.from('products').delete().eq('id', product.id)
    throw new Error(specsError.message)
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

  if (productError) throw new Error(productError.message)

  await supabase.from('product_specs').delete().eq('product_id', productId)

  const specsToInsert = validated.specs.map((spec) => ({
    product_id: productId,
    gsm: spec.gsm,
    caliper: convertToMicrometers(spec.caliper, spec.caliper_unit),
    tensile_md: spec.tensile_md
      ? convertToKNPerMeter(spec.tensile_md, spec.tensile_unit)
      : null,
    tensile_cd: spec.tensile_cd
      ? convertToKNPerMeter(spec.tensile_cd, spec.tensile_unit)
      : null,
    tear_md: spec.tear_md
      ? convertToMillinewtons(spec.tear_md, spec.tear_unit)
      : null,
    tear_cd: spec.tear_cd
      ? convertToMillinewtons(spec.tear_cd, spec.tear_unit)
      : null,
    extra_specs: spec.extra_specs,
  }))

  const { error: specsError } = await supabase
    .from('product_specs')
    .insert(specsToInsert)

  if (specsError) throw new Error(specsError.message)

  revalidatePath('/products')
  revalidatePath(`/products/${productId}`)
}

export async function deleteProduct(productId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.from('products').delete().eq('id', productId)

  if (error) throw new Error(error.message)

  revalidatePath('/products')
}

export async function getProducts() {
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
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function createCategory(data: CategoryFormData) {
  await requireAdmin()
  const validated = categoryFormSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase.from('categories').insert(validated)

  if (error) throw new Error(error.message)
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

  if (error) throw new Error(error.message)
  revalidatePath('/categories')
  revalidatePath('/products')
}

export async function deleteCategory(id: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.from('categories').delete().eq('id', id)

  if (error) throw new Error(error.message)
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

  if (error) throw new Error(error.message)
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

  if (error) throw new Error(error.message)
  return data
}

export async function getCategories() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw new Error(error.message)
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

  if (error) throw new Error(error.message)
  return data
}
