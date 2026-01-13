import { describe, it, expect } from 'vitest'
import {
  buildStorageKey,
  sanitizeForFilename,
  generateTimestampedFilename,
  STORAGE_PATHS,
} from './storage'
import { assertValidKey, InvalidStorageKeyError } from './r2-client'

describe('buildStorageKey', () => {
  it('constructs path with prefix, userId, and filename', () => {
    const key = buildStorageKey(STORAGE_PATHS.TDS_PDFS, 'user-123', 'doc.pdf')
    expect(key).toBe('tds-pdfs/user-123/doc.pdf')
  })

  it('works with SOURCE_PDFS prefix', () => {
    const key = buildStorageKey(
      STORAGE_PATHS.SOURCE_PDFS,
      'user-456',
      'spec.pdf'
    )
    expect(key).toBe('source-pdfs/user-456/spec.pdf')
  })
})

describe('sanitizeForFilename', () => {
  it('converts to lowercase', () => {
    expect(sanitizeForFilename('HelloWorld')).toBe('helloworld')
  })

  it('replaces spaces with underscores', () => {
    expect(sanitizeForFilename('hello world')).toBe('hello_world')
  })

  it('replaces special characters with underscores', () => {
    expect(sanitizeForFilename('hello@world#test')).toBe('hello_world_test')
  })

  it('collapses multiple underscores', () => {
    expect(sanitizeForFilename('hello___world')).toBe('hello_world')
  })

  it('removes leading and trailing underscores', () => {
    expect(sanitizeForFilename('_hello_')).toBe('hello')
  })

  it('returns unnamed for non-ascii input like Korean', () => {
    expect(sanitizeForFilename('한솔제지')).toBe('unnamed')
  })

  it('returns unnamed for empty string', () => {
    expect(sanitizeForFilename('')).toBe('unnamed')
  })

  it('returns unnamed for only special characters', () => {
    expect(sanitizeForFilename('!@#$%')).toBe('unnamed')
  })

  it('preserves numbers', () => {
    expect(sanitizeForFilename('test123')).toBe('test123')
  })
})

describe('generateTimestampedFilename', () => {
  it('generates filename with sanitized names, timestamp, and unique id', () => {
    const filename = generateTimestampedFilename('Hansol', 'Hi-Q Coated')
    expect(filename).toMatch(/^hansol_hi_q_coated_\d+_[a-f0-9]{8}\.pdf$/)
  })

  it('uses custom extension when provided', () => {
    const filename = generateTimestampedFilename('Mill', 'Product', 'docx')
    expect(filename).toMatch(/^mill_product_\d+_[a-f0-9]{8}\.docx$/)
  })

  it('handles special characters in names', () => {
    const filename = generateTimestampedFilename('APP (Asia)', 'Kraft #200')
    expect(filename).toMatch(/^app_asia_kraft_200_\d+_[a-f0-9]{8}\.pdf$/)
  })

  it('handles non-ascii names with fallback', () => {
    const filename = generateTimestampedFilename('한솔', '제품')
    expect(filename).toMatch(/^unnamed_unnamed_\d+_[a-f0-9]{8}\.pdf$/)
  })

  it('generates unique filenames for same input', () => {
    const filename1 = generateTimestampedFilename('Mill', 'Product')
    const filename2 = generateTimestampedFilename('Mill', 'Product')
    expect(filename1).not.toBe(filename2)
  })
})

describe('STORAGE_PATHS', () => {
  it('has correct path values', () => {
    expect(STORAGE_PATHS.TDS_PDFS).toBe('tds-pdfs')
    expect(STORAGE_PATHS.SOURCE_PDFS).toBe('source-pdfs')
  })
})

describe('assertValidKey', () => {
  it('accepts valid keys', () => {
    expect(() => assertValidKey('tds-pdfs/user-123/doc.pdf')).not.toThrow()
    expect(() => assertValidKey('source-pdfs/abc/file.pdf')).not.toThrow()
    expect(() => assertValidKey('a')).not.toThrow()
  })

  it('rejects empty keys', () => {
    expect(() => assertValidKey('')).toThrow(InvalidStorageKeyError)
    expect(() => assertValidKey('   ')).toThrow(InvalidStorageKeyError)
  })

  it('rejects keys starting with /', () => {
    expect(() => assertValidKey('/path/to/file')).toThrow(
      InvalidStorageKeyError
    )
  })

  it('rejects keys containing ..', () => {
    expect(() => assertValidKey('path/../secret')).toThrow(
      InvalidStorageKeyError
    )
    expect(() => assertValidKey('../etc/passwd')).toThrow(
      InvalidStorageKeyError
    )
  })

  it('rejects keys containing //', () => {
    expect(() => assertValidKey('path//to//file')).toThrow(
      InvalidStorageKeyError
    )
  })

  it('rejects keys exceeding max length', () => {
    const longKey = 'a'.repeat(1025)
    expect(() => assertValidKey(longKey)).toThrow(InvalidStorageKeyError)
  })

  it('accepts keys at max length', () => {
    const maxKey = 'a'.repeat(1024)
    expect(() => assertValidKey(maxKey)).not.toThrow()
  })
})
