import { describe, it, expect } from 'vitest'
import { productFormSchema, productSpecSchema, tdsSpecSchema } from './product'

describe('productSpecSchema', () => {
  it('validates valid spec with all fields', () => {
    const validSpec = {
      gsm: 100,
      caliper: 150,
      tensile_md: 5.5,
      tensile_cd: 4.2,
      tear_md: 800,
      tear_cd: 900,
      extra_specs: {},
    }
    const result = productSpecSchema.safeParse(validSpec)
    expect(result.success).toBe(true)
  })

  it('validates spec with only required fields', () => {
    const minimalSpec = {
      gsm: 80,
      caliper: 100,
      extra_specs: {},
    }
    const result = productSpecSchema.safeParse(minimalSpec)
    expect(result.success).toBe(true)
  })

  it('rejects gsm <= 0', () => {
    const invalidSpec = {
      gsm: 0,
      caliper: 100,
      extra_specs: {},
    }
    const result = productSpecSchema.safeParse(invalidSpec)
    expect(result.success).toBe(false)
  })

  it('rejects negative gsm', () => {
    const invalidSpec = {
      gsm: -50,
      caliper: 100,
      extra_specs: {},
    }
    const result = productSpecSchema.safeParse(invalidSpec)
    expect(result.success).toBe(false)
  })

  it('rejects caliper <= 0', () => {
    const invalidSpec = {
      gsm: 100,
      caliper: 0,
      extra_specs: {},
    }
    const result = productSpecSchema.safeParse(invalidSpec)
    expect(result.success).toBe(false)
  })

  it('rejects negative tensile values', () => {
    const spec = {
      gsm: 100,
      caliper: 150,
      tensile_md: -1,
      extra_specs: {},
    }
    const result = productSpecSchema.safeParse(spec)
    expect(result.success).toBe(false)
  })

  it('rejects negative tear values', () => {
    const spec = {
      gsm: 100,
      caliper: 150,
      tear_md: -1,
      extra_specs: {},
    }
    const result = productSpecSchema.safeParse(spec)
    expect(result.success).toBe(false)
  })
})

describe('productFormSchema', () => {
  const validSpec = {
    gsm: 100,
    caliper: 150,
    extra_specs: {},
  }

  it('validates valid product form', () => {
    const validForm = {
      mill_name: 'Test Mill',
      name: 'Test Product',
      category_id: '123e4567-e89b-12d3-a456-426614174000',
      specs: [validSpec],
    }
    const result = productFormSchema.safeParse(validForm)
    expect(result.success).toBe(true)
  })

  it('rejects empty mill_name', () => {
    const invalidForm = {
      mill_name: '',
      name: 'Test Product',
      category_id: '123e4567-e89b-12d3-a456-426614174000',
      specs: [validSpec],
    }
    const result = productFormSchema.safeParse(invalidForm)
    expect(result.success).toBe(false)
  })

  it('rejects empty name', () => {
    const invalidForm = {
      mill_name: 'Test Mill',
      name: '',
      category_id: '123e4567-e89b-12d3-a456-426614174000',
      specs: [validSpec],
    }
    const result = productFormSchema.safeParse(invalidForm)
    expect(result.success).toBe(false)
  })

  it('rejects empty specs array', () => {
    const invalidForm = {
      mill_name: 'Test Mill',
      name: 'Test Product',
      category_id: '123e4567-e89b-12d3-a456-426614174000',
      specs: [],
    }
    const result = productFormSchema.safeParse(invalidForm)
    expect(result.success).toBe(false)
  })

  it('accepts multiple specs', () => {
    const validForm = {
      mill_name: 'Test Mill',
      name: 'Test Product',
      category_id: '123e4567-e89b-12d3-a456-426614174000',
      specs: [
        { ...validSpec, gsm: 80 },
        { ...validSpec, gsm: 100 },
        { ...validSpec, gsm: 120 },
      ],
    }
    const result = productFormSchema.safeParse(validForm)
    expect(result.success).toBe(true)
  })

  it('accepts optional category_id', () => {
    const validForm = {
      mill_name: 'Test Mill',
      name: 'Test Product',
      specs: [validSpec],
    }
    const result = productFormSchema.safeParse(validForm)
    expect(result.success).toBe(true)
  })

  it('trims whitespace from mill_name and name', () => {
    const validForm = {
      mill_name: '  Test Mill  ',
      name: '  Test Product  ',
      specs: [validSpec],
    }
    const result = productFormSchema.safeParse(validForm)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.mill_name).toBe('Test Mill')
      expect(result.data.name).toBe('Test Product')
    }
  })
})

describe('tdsSpecSchema', () => {
  it('validates valid tds spec with all fields', () => {
    const validSpec = {
      gsm: 100,
      caliper: { value: 120, unit: 'µm' },
      tensile_md: { value: 5.5, unit: 'kN/m' },
      smoothness: { value: 20, unit: 'sec', method: 'Bekk' },
      stiffness_md: { value: 10, unit: 'mN·m' },
      brightness: 95,
      opacity: 98,
      moisture: 5.5,
      density: 0.8,
      cobb_60: 25,
      extra_specs: {},
    }
    const result = tdsSpecSchema.safeParse(validSpec)
    expect(result.success).toBe(true)
  })

  it('validates minimal tds spec (only GSM)', () => {
    const minimalSpec = {
      gsm: 100,
    }
    const result = tdsSpecSchema.safeParse(minimalSpec)
    expect(result.success).toBe(true)
  })

  it('validates optional nested objects', () => {
    const spec = {
      gsm: 100,
      smoothness: { value: 20, unit: 'sec', method: 'Bekk' },
    }
    const result = tdsSpecSchema.safeParse(spec)
    expect(result.success).toBe(true)
  })

  it('rejects invalid nested structure', () => {
    const spec = {
      gsm: 'invalid' as unknown as number,
    }
    const result = tdsSpecSchema.safeParse(spec)
    expect(result.success).toBe(false)
  })

  it('rejects invalid enum values', () => {
    const spec = {
      gsm: 100,
      smoothness: { value: 20, unit: 'invalid', method: 'Bekk' },
    }
    const result = tdsSpecSchema.safeParse(spec)
    expect(result.success).toBe(false)
  })
})
