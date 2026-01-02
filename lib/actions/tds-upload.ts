'use server'

import { createClient } from '@/utils/supabase/server'
import { requireAdmin, getUser } from '@/lib/auth'
import {
  tdsProductFormSchema,
  type TDSProductFormData,
} from '@/lib/validations/product'
import { parseTDSWithRetry, TDSParseError } from '@/lib/ai/tds-parser'
import {
  convertToMicrometers,
  convertToKNPerMeter,
  convertToMillinewtons,
  convertStiffness,
  type ThicknessUnit,
  type TensileUnit,
  type TearUnit,
  type StiffnessUnit,
} from '@/utils/unit-converters'
import { revalidatePath } from 'next/cache'
import type { TDSParseResult, SmoothnessUnit } from '@/types/database'

const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function uploadTDSPdf(
  formData: FormData
): Promise<{ path: string; base64: string }> {
  await requireAdmin()
  const user = await getUser()
  if (!user) throw new Error('Not authenticated')

  const file = formData.get('file') as File
  if (!file) {
    throw new Error('No file provided')
  }

  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are allowed')
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size must be less than 10MB')
  }

  const supabase = await createClient()
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${user.id}/${timestamp}_${safeName}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from('spec-sheets')
    .upload(filePath, buffer, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  const base64 = buffer.toString('base64')

  return { path: filePath, base64 }
}

export async function parseTDS(pdfBase64: string): Promise<TDSParseResult> {
  await requireAdmin()

  try {
    return await parseTDSWithRetry(pdfBase64)
  } catch (error) {
    if (error instanceof TDSParseError) {
      throw error
    }
    throw new Error(
      `Failed to parse TDS: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export async function saveTDSProduct(data: TDSProductFormData) {
  await requireAdmin()
  const user = await getUser()
  if (!user) throw new Error('Not authenticated')

  const validated = tdsProductFormSchema.parse(data)
  const supabase = await createClient()

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      mill_name: validated.mill_name,
      name: validated.product_name,
      category_id: validated.category_id || null,
      file_url: validated.file_url,
      created_by: user.id,
    })
    .select()
    .single()

  if (productError) {
    throw new Error(`Failed to create product: ${productError.message}`)
  }

  const specsToInsert = validated.specs.map((spec) => {
    const dbSpec: Record<string, unknown> = {
      product_id: product.id,
      gsm: spec.gsm,
      caliper:
        spec.caliper?.value != null
          ? convertToMicrometers(
              spec.caliper.value,
              spec.caliper.unit as ThicknessUnit
            )
          : 0,
      extra_specs: spec.extra_specs || {},
    }

    if (spec.tensile_md?.value != null) {
      dbSpec.tensile_md = convertToKNPerMeter(
        spec.tensile_md.value,
        spec.tensile_md.unit as TensileUnit
      )
    }
    if (spec.tensile_cd?.value != null) {
      dbSpec.tensile_cd = convertToKNPerMeter(
        spec.tensile_cd.value,
        spec.tensile_cd.unit as TensileUnit
      )
    }
    if (spec.tear_md?.value != null) {
      dbSpec.tear_md = convertToMillinewtons(
        spec.tear_md.value,
        spec.tear_md.unit as TearUnit
      )
    }
    if (spec.tear_cd?.value != null) {
      dbSpec.tear_cd = convertToMillinewtons(
        spec.tear_cd.value,
        spec.tear_cd.unit as TearUnit
      )
    }
    if (spec.smoothness?.value != null) {
      dbSpec.smoothness = spec.smoothness.value
      dbSpec.smoothness_unit = spec.smoothness.unit
    }
    if (spec.stiffness_md?.value != null) {
      dbSpec.stiffness_md = convertStiffness(
        spec.stiffness_md.value,
        spec.stiffness_md.unit as StiffnessUnit
      )
    }
    if (spec.stiffness_cd?.value != null) {
      dbSpec.stiffness_cd = convertStiffness(
        spec.stiffness_cd.value,
        spec.stiffness_cd.unit as StiffnessUnit
      )
    }
    if (spec.brightness !== undefined && spec.brightness !== null) {
      dbSpec.brightness = spec.brightness
    }
    if (spec.cobb_60 !== undefined && spec.cobb_60 !== null) {
      dbSpec.cobb_60 = spec.cobb_60
    }
    if (spec.density !== undefined && spec.density !== null) {
      dbSpec.density = spec.density
    }
    if (spec.opacity !== undefined && spec.opacity !== null) {
      dbSpec.opacity = spec.opacity
    }
    if (spec.moisture !== undefined && spec.moisture !== null) {
      dbSpec.moisture = spec.moisture
    }

    return dbSpec
  })

  const { error: specsError } = await supabase
    .from('product_specs')
    .insert(specsToInsert)

  if (specsError) {
    await supabase.from('products').delete().eq('id', product.id)
    throw new Error(`Failed to save specifications: ${specsError.message}`)
  }

  revalidatePath('/products')
  return product
}

export async function getStorageUrl(path: string): Promise<string> {
  const supabase = await createClient()

  const { data } = await supabase.storage
    .from('spec-sheets')
    .createSignedUrl(path, 3600)

  if (!data?.signedUrl) {
    throw new Error('Failed to generate signed URL')
  }

  return data.signedUrl
}

export async function deleteStorageFile(path: string): Promise<void> {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase.storage.from('spec-sheets').remove([path])

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}
