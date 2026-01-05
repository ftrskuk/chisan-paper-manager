import { describe, it, expect } from 'vitest'
import {
  buildSpecsForInsert,
  type SpecInput,
  type SpecForInsert,
} from './product-helpers'

describe('buildSpecsForInsert', () => {
  const productId = 'test-product-id-123'

  describe('basic mapping', () => {
    it('maps a single spec with all required fields', () => {
      const specs: SpecInput[] = [
        {
          gsm: 80,
          caliper: 100,
          extra_specs: {},
        },
      ]

      const result = buildSpecsForInsert(productId, specs)

      expect(result).toEqual([
        {
          product_id: productId,
          gsm: 80,
          caliper: 100,
          tensile_md: null,
          tensile_cd: null,
          tear_md: null,
          tear_cd: null,
          extra_specs: {},
        },
      ])
    })

    it('maps multiple specs correctly', () => {
      const specs: SpecInput[] = [
        { gsm: 80, caliper: 100, extra_specs: {} },
        { gsm: 100, caliper: 120, extra_specs: {} },
        { gsm: 120, caliper: 140, extra_specs: {} },
      ]

      const result = buildSpecsForInsert(productId, specs)

      expect(result).toHaveLength(3)
      expect(result[0].gsm).toBe(80)
      expect(result[1].gsm).toBe(100)
      expect(result[2].gsm).toBe(120)
      result.forEach((spec) => {
        expect(spec.product_id).toBe(productId)
      })
    })
  })

  describe('optional fields handling', () => {
    it('includes tensile values when provided', () => {
      const specs: SpecInput[] = [
        {
          gsm: 80,
          caliper: 100,
          tensile_md: 5.5,
          tensile_cd: 3.2,
          extra_specs: {},
        },
      ]

      const result = buildSpecsForInsert(productId, specs)

      expect(result[0].tensile_md).toBe(5.5)
      expect(result[0].tensile_cd).toBe(3.2)
    })

    it('includes tear values when provided', () => {
      const specs: SpecInput[] = [
        {
          gsm: 80,
          caliper: 100,
          tear_md: 450,
          tear_cd: 380,
          extra_specs: {},
        },
      ]

      const result = buildSpecsForInsert(productId, specs)

      expect(result[0].tear_md).toBe(450)
      expect(result[0].tear_cd).toBe(380)
    })

    it('converts undefined optional fields to null', () => {
      const specs: SpecInput[] = [
        {
          gsm: 80,
          caliper: 100,
          tensile_md: undefined,
          tensile_cd: undefined,
          tear_md: undefined,
          tear_cd: undefined,
          extra_specs: {},
        },
      ]

      const result = buildSpecsForInsert(productId, specs)

      expect(result[0].tensile_md).toBeNull()
      expect(result[0].tensile_cd).toBeNull()
      expect(result[0].tear_md).toBeNull()
      expect(result[0].tear_cd).toBeNull()
    })

    it('handles mixed optional fields', () => {
      const specs: SpecInput[] = [
        {
          gsm: 80,
          caliper: 100,
          tensile_md: 5.5,
          tear_md: 450,
          extra_specs: {},
        },
      ]

      const result = buildSpecsForInsert(productId, specs)

      expect(result[0].tensile_md).toBe(5.5)
      expect(result[0].tensile_cd).toBeNull()
      expect(result[0].tear_md).toBe(450)
      expect(result[0].tear_cd).toBeNull()
    })
  })

  describe('extra_specs handling', () => {
    it('preserves extra_specs object', () => {
      const extraSpecs = {
        brightness: 85,
        opacity: 92,
        custom_field: 'test value',
      }
      const specs: SpecInput[] = [
        {
          gsm: 80,
          caliper: 100,
          extra_specs: extraSpecs,
        },
      ]

      const result = buildSpecsForInsert(productId, specs)

      expect(result[0].extra_specs).toEqual(extraSpecs)
    })

    it('handles empty extra_specs object', () => {
      const specs: SpecInput[] = [
        {
          gsm: 80,
          caliper: 100,
          extra_specs: {},
        },
      ]

      const result = buildSpecsForInsert(productId, specs)

      expect(result[0].extra_specs).toEqual({})
    })

    it('handles complex nested extra_specs', () => {
      const extraSpecs = {
        smoothness: { value: 100, unit: 'sec', method: 'Bekk' },
        array_field: [1, 2, 3],
      }
      const specs: SpecInput[] = [
        {
          gsm: 80,
          caliper: 100,
          extra_specs: extraSpecs,
        },
      ]

      const result = buildSpecsForInsert(productId, specs)

      expect(result[0].extra_specs).toEqual(extraSpecs)
    })
  })

  describe('edge cases', () => {
    it('returns empty array for empty specs input', () => {
      const result = buildSpecsForInsert(productId, [])

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('handles zero values correctly', () => {
      const specs: SpecInput[] = [
        {
          gsm: 80,
          caliper: 100,
          tensile_md: 0,
          tensile_cd: 0,
          tear_md: 0,
          tear_cd: 0,
          extra_specs: {},
        },
      ]

      const result = buildSpecsForInsert(productId, specs)

      expect(result[0].tensile_md).toBe(0)
      expect(result[0].tensile_cd).toBe(0)
      expect(result[0].tear_md).toBe(0)
      expect(result[0].tear_cd).toBe(0)
    })

    it('handles decimal values correctly', () => {
      const specs: SpecInput[] = [
        {
          gsm: 80.5,
          caliper: 100.123,
          tensile_md: 5.5678,
          extra_specs: {},
        },
      ]

      const result = buildSpecsForInsert(productId, specs)

      expect(result[0].gsm).toBe(80.5)
      expect(result[0].caliper).toBe(100.123)
      expect(result[0].tensile_md).toBe(5.5678)
    })
  })

  describe('type safety', () => {
    it('returns correctly typed SpecForInsert array', () => {
      const specs: SpecInput[] = [
        {
          gsm: 80,
          caliper: 100,
          extra_specs: {},
        },
      ]

      const result: SpecForInsert[] = buildSpecsForInsert(productId, specs)

      const firstSpec = result[0]
      expect(typeof firstSpec.product_id).toBe('string')
      expect(typeof firstSpec.gsm).toBe('number')
      expect(typeof firstSpec.caliper).toBe('number')
      expect(
        firstSpec.tensile_md === null ||
          typeof firstSpec.tensile_md === 'number'
      ).toBe(true)
      expect(
        firstSpec.tensile_cd === null ||
          typeof firstSpec.tensile_cd === 'number'
      ).toBe(true)
      expect(
        firstSpec.tear_md === null || typeof firstSpec.tear_md === 'number'
      ).toBe(true)
      expect(
        firstSpec.tear_cd === null || typeof firstSpec.tear_cd === 'number'
      ).toBe(true)
      expect(typeof firstSpec.extra_specs).toBe('object')
    })
  })
})
