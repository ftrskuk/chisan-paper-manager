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

  if (error) {
    throw new Error(error.message, { cause: error })
  }
  return data
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
