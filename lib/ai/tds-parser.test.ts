import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => {
  return {
    create: vi.fn(),
  }
})

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn(() => ({
      messages: {
        create: mocks.create,
      },
    })),
  }
})

import { parseTDSDocument } from './tds-parser'

describe('parseTDSDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = 'test-key'
  })

  it('successfully parses valid TDS response', async () => {
    const mockResponse = {
      mill_name: 'Test Mill',
      product_name: 'Test Product',
      category_hint: 'Kraft',
      specs: [
        {
          gsm: 100,
          caliper: { value: 120, unit: 'µm' },
          tensile_md: { value: 5.5, unit: 'kN/m' },
          smoothness: 20,
          roughness: 150,
          whiteness: 80,
        },
      ],
      test_standards: ['ISO 1234'],
      notes: 'Test notes',
    }

    mocks.create.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockResponse),
        },
      ],
    })

    const result = await parseTDSDocument('base64data')

    expect(result).toEqual({
      mill_name: 'Test Mill',
      product_name: 'Test Product',
      category_hint: 'Kraft',
      specs: [
        {
          gsm: 100,
          caliper: { value: 120, unit: 'µm' },
          tensile_md: { value: 5.5, unit: 'kN/m' },
          smoothness: 20,
          roughness: 150,
          whiteness: 80,
        },
      ],
      test_standards: ['ISO 1234'],
      notes: 'Test notes',
    })
  })

  it('converts units to standard units', async () => {
    const mockResponse = {
      mill_name: 'Test Mill',
      product_name: 'Test Product',
      category_hint: 'Kraft',
      specs: [
        {
          gsm: 100,
          caliper: { value: 0.12, unit: 'mm' }, // Should convert to 120 µm
          tensile_md: { value: 1000, unit: 'N/15mm' }, // Should convert to ~6.67 kN/m
          tear_md: { value: 10, unit: 'gf' }, // Should convert to ~98.07 mN
        },
      ],
    }

    mocks.create.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockResponse),
        },
      ],
    })

    const result = await parseTDSDocument('base64data')
    const spec = result.specs[0]

    expect(spec.caliper).toEqual({ value: 120, unit: 'µm' })
    // 1000 N/15mm -> 1000 * (1 / 0.015 / 1000) = 66.67
    expect(spec.tensile_md?.unit).toBe('kN/m')
    expect(spec.tensile_md?.value).toBeCloseTo(66.67, 1)

    // 10 gf -> 10 * 9.80665 = 98.07
    expect(spec.tear_md?.unit).toBe('mN')
    expect(spec.tear_md?.value).toBeCloseTo(98.07, 1)
  })

  it('throws error if API key is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY
    await expect(parseTDSDocument('data')).rejects.toThrow(
      'ANTHROPIC_API_KEY environment variable is not set'
    )
  })

  it('handles missing required fields gracefully', async () => {
    const mockResponse = {
      // Missing mill_name and product_name
      specs: [{ gsm: 80 }],
    }

    mocks.create.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockResponse),
        },
      ],
    })

    const result = await parseTDSDocument('data')

    expect(result.mill_name).toBe('-')
    expect(result.product_name).toBe('-')
  })

  it('normalizes missing optional fields', async () => {
    const mockResponse = {
      mill_name: 'Test Mill',
      product_name: 'Test Product',
      category_hint: 'UWF',
      specs: [{ gsm: 80 }],
    }

    mocks.create.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockResponse),
        },
      ],
    })

    const result = await parseTDSDocument('data')

    expect(result.specs[0]).toEqual({ gsm: 80 })
    expect(result.test_standards).toBeUndefined()
    expect(result.notes).toBeUndefined()
  })

  it('validates spec data types', async () => {
    const mockResponse = {
      mill_name: 'Test Mill',
      product_name: 'Test Product',
      specs: [{ gsm: 'invalid' }],
    }

    mocks.create.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockResponse),
        },
      ],
    })

    await expect(parseTDSDocument('data')).rejects.toThrow(
      'Invalid GSM at spec index 0'
    )
  })

  it('filters out invalid nested objects in specs', async () => {
    const mockResponse = {
      mill_name: 'Test Mill',
      product_name: 'Test Product',
      specs: [
        {
          gsm: 100,
          caliper: { value: 0, unit: 'µm' },
          tensile_md: { value: 5, unit: 'invalid' },
        },
      ],
    }

    mocks.create.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockResponse),
        },
      ],
    })

    const result = await parseTDSDocument('data')
    expect(result.specs[0].caliper).toBeUndefined()
    // The invalid unit tensile should be preserved as-is with fallback or caught by warning and preserved
    expect(result.specs[0].tensile_md).toEqual({ value: 5, unit: 'invalid' })
  })

  it('throws error when no text response from Claude', async () => {
    mocks.create.mockResolvedValue({
      content: [],
    })

    await expect(parseTDSDocument('data')).rejects.toThrow(
      'No text response from Claude'
    )
  })

  it('calls Claude API with correct parameters', async () => {
    const mockResponse = {
      mill_name: 'Test Mill',
      product_name: 'Test Product',
      specs: [{ gsm: 100 }],
    }

    mocks.create.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockResponse),
        },
      ],
    })

    await parseTDSDocument('testBase64Data')

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.arrayContaining([
              expect.objectContaining({
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: 'testBase64Data',
                },
              }),
            ]),
          }),
        ]),
      })
    )
  })
})
