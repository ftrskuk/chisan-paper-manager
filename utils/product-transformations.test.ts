import { describe, it, expect } from 'vitest'
import {
  transformExtraSpecsToRecord,
  parseNumericValue,
  type ExtraSpecEntry,
} from './product-transformations'

describe('parseNumericValue', () => {
  describe('numeric strings', () => {
    it('converts integer string to number', () => {
      expect(parseNumericValue('42')).toBe(42)
    })

    it('converts float string to number', () => {
      expect(parseNumericValue('3.14')).toBe(3.14)
    })

    it('converts negative number string to number', () => {
      expect(parseNumericValue('-10')).toBe(-10)
    })

    it('preserves percentage strings as-is', () => {
      expect(parseNumericValue('7%')).toBe('7%')
    })

    it('handles scientific notation', () => {
      expect(parseNumericValue('1.5e3')).toBe(1500)
    })
  })

  describe('non-numeric strings', () => {
    it('returns string as-is for text', () => {
      expect(parseNumericValue('hello')).toBe('hello')
    })

    it('returns empty string as-is', () => {
      expect(parseNumericValue('')).toBe('')
    })

    it('returns whitespace string as-is', () => {
      expect(parseNumericValue('  ')).toBe('  ')
    })

    it('returns mixed alphanumeric as string', () => {
      expect(parseNumericValue('abc123')).toBe('abc123')
    })
  })

  describe('edge cases', () => {
    it('handles zero', () => {
      expect(parseNumericValue('0')).toBe(0)
    })

    it('handles decimal-only string', () => {
      expect(parseNumericValue('.')).toBe('.')
    })

    it('handles leading/trailing spaces in numeric string', () => {
      expect(parseNumericValue(' 42 ')).toBe(42)
    })
  })
})

describe('transformExtraSpecsToRecord', () => {
  describe('basic transformations', () => {
    it('transforms empty array to empty object', () => {
      const entries: ExtraSpecEntry[] = []
      expect(transformExtraSpecsToRecord(entries)).toEqual({})
    })

    it('transforms single key-value pair', () => {
      const entries: ExtraSpecEntry[] = [{ key: 'brightness', value: '90' }]
      expect(transformExtraSpecsToRecord(entries)).toEqual({
        brightness: 90,
      })
    })

    it('transforms multiple key-value pairs', () => {
      const entries: ExtraSpecEntry[] = [
        { key: 'brightness', value: '90' },
        { key: 'opacity', value: '95.5' },
        { key: 'color', value: 'white' },
      ]
      expect(transformExtraSpecsToRecord(entries)).toEqual({
        brightness: 90,
        opacity: 95.5,
        color: 'white',
      })
    })
  })

  describe('key trimming', () => {
    it('trims whitespace from keys', () => {
      const entries: ExtraSpecEntry[] = [
        { key: '  brightness  ', value: '90' },
        { key: 'opacity\t', value: '95' },
      ]
      expect(transformExtraSpecsToRecord(entries)).toEqual({
        brightness: 90,
        opacity: 95,
      })
    })

    it('ignores entries with empty keys after trimming', () => {
      const entries: ExtraSpecEntry[] = [
        { key: '', value: '90' },
        { key: '   ', value: '95' },
        { key: 'valid', value: '100' },
      ]
      expect(transformExtraSpecsToRecord(entries)).toEqual({
        valid: 100,
      })
    })
  })

  describe('value type conversion', () => {
    it('converts numeric strings to numbers', () => {
      const entries: ExtraSpecEntry[] = [
        { key: 'integer', value: '100' },
        { key: 'float', value: '3.14' },
        { key: 'negative', value: '-5' },
      ]
      expect(transformExtraSpecsToRecord(entries)).toEqual({
        integer: 100,
        float: 3.14,
        negative: -5,
      })
    })

    it('preserves non-numeric strings', () => {
      const entries: ExtraSpecEntry[] = [
        { key: 'material', value: 'recycled' },
        { key: 'grade', value: 'A+' },
      ]
      expect(transformExtraSpecsToRecord(entries)).toEqual({
        material: 'recycled',
        grade: 'A+',
      })
    })

    it('handles mixed numeric and non-numeric values', () => {
      const entries: ExtraSpecEntry[] = [
        { key: 'brightness', value: '90' },
        { key: 'color', value: 'white' },
        { key: 'thickness', value: '0.15' },
      ]
      expect(transformExtraSpecsToRecord(entries)).toEqual({
        brightness: 90,
        color: 'white',
        thickness: 0.15,
      })
    })
  })

  describe('edge cases', () => {
    it('handles duplicate keys (last one wins)', () => {
      const entries: ExtraSpecEntry[] = [
        { key: 'brightness', value: '90' },
        { key: 'brightness', value: '95' },
      ]
      expect(transformExtraSpecsToRecord(entries)).toEqual({
        brightness: 95,
      })
    })

    it('handles entries with empty values', () => {
      const entries: ExtraSpecEntry[] = [
        { key: 'key1', value: '' },
        { key: 'key2', value: '100' },
      ]
      expect(transformExtraSpecsToRecord(entries)).toEqual({
        key1: '',
        key2: 100,
      })
    })
  })
})
