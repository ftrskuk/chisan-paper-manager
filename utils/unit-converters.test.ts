import { describe, it, expect } from 'vitest'
import {
  convertThickness,
  convertTensile,
  convertTear,
  convertStiffness,
  bekkToPPS,
  ppsToBekk,
  getSmoothnessMethod,
  type ThicknessUnit,
  type TensileUnit,
  type TearUnit,
  type StiffnessUnit,
} from './unit-converters'

describe('convertThickness (to µm)', () => {
  describe('mm to µm', () => {
    it('converts 1 mm to 1000 µm', () => {
      expect(convertThickness(1, 'mm')).toBe(1000)
    })

    it('converts 0.5 mm to 500 µm', () => {
      expect(convertThickness(0.5, 'mm')).toBe(500)
    })

    it('converts 0.1 mm to 100 µm', () => {
      expect(convertThickness(0.1, 'mm')).toBeCloseTo(100, 5)
    })
  })

  describe('mil to µm', () => {
    it('converts 1 mil to 25.4 µm', () => {
      expect(convertThickness(1, 'mil')).toBeCloseTo(25.4, 2)
    })

    it('converts 10 mil to 254 µm', () => {
      expect(convertThickness(10, 'mil')).toBeCloseTo(254, 2)
    })
  })

  describe('inch to µm', () => {
    it('converts 1 inch to 25400 µm', () => {
      expect(convertThickness(1, 'inch')).toBeCloseTo(25400, 0)
    })

    it('converts 0.001 inch to 25.4 µm', () => {
      expect(convertThickness(0.001, 'inch')).toBeCloseTo(25.4, 2)
    })
  })

  describe('µm (identity)', () => {
    it('returns same value for µm input', () => {
      expect(convertThickness(100, 'µm')).toBe(100)
    })
  })

  describe('edge cases', () => {
    it('handles zero', () => {
      expect(convertThickness(0, 'mm')).toBe(0)
    })

    it('throws for negative values', () => {
      expect(() => convertThickness(-1, 'mm')).toThrow()
    })

    it('throws for invalid unit', () => {
      expect(() => convertThickness(1, 'invalid' as ThicknessUnit)).toThrow()
    })
  })
})

describe('convertTensile (to kN/m)', () => {
  describe('kgf/15mm to kN/m', () => {
    it('converts 1 kgf/15mm to approximately 0.654 kN/m', () => {
      const result = convertTensile(1, 'kgf/15mm')
      expect(result).toBeCloseTo(0.654, 2)
    })

    it('converts 10 kgf/15mm to approximately 6.54 kN/m', () => {
      const result = convertTensile(10, 'kgf/15mm')
      expect(result).toBeCloseTo(6.54, 1)
    })
  })

  describe('N/15mm to kN/m', () => {
    it('converts 15 N/15mm to 1 kN/m', () => {
      const result = convertTensile(15, 'N/15mm')
      expect(result).toBeCloseTo(1, 2)
    })

    it('converts 1 N/15mm to approximately 0.0667 kN/m', () => {
      const result = convertTensile(1, 'N/15mm')
      expect(result).toBeCloseTo(0.0667, 3)
    })
  })

  describe('lb/in to kN/m', () => {
    it('converts 1 lb/in to approximately 0.175 kN/m', () => {
      const result = convertTensile(1, 'lb/in')
      expect(result).toBeCloseTo(0.175, 2)
    })

    it('converts 10 lb/in to approximately 1.75 kN/m', () => {
      const result = convertTensile(10, 'lb/in')
      expect(result).toBeCloseTo(1.75, 1)
    })
  })

  describe('kN/m (identity)', () => {
    it('returns same value for kN/m input', () => {
      expect(convertTensile(5.5, 'kN/m')).toBe(5.5)
    })
  })

  describe('edge cases', () => {
    it('handles zero', () => {
      expect(convertTensile(0, 'kgf/15mm')).toBe(0)
    })

    it('throws for negative values', () => {
      expect(() => convertTensile(-1, 'N/15mm')).toThrow()
    })

    it('throws for invalid unit', () => {
      expect(() => convertTensile(1, 'invalid' as TensileUnit)).toThrow()
    })
  })
})

describe('convertTear (to mN)', () => {
  describe('gf to mN', () => {
    it('converts 1 gf to approximately 9.807 mN', () => {
      expect(convertTear(1, 'gf')).toBeCloseTo(9.807, 2)
    })

    it('converts 100 gf to approximately 980.7 mN', () => {
      expect(convertTear(100, 'gf')).toBeCloseTo(980.7, 1)
    })

    it('converts 64 gf (common tear value) correctly', () => {
      expect(convertTear(64, 'gf')).toBeCloseTo(627.6, 1)
    })
  })

  describe('cN to mN', () => {
    it('converts 1 cN to 10 mN', () => {
      expect(convertTear(1, 'cN')).toBe(10)
    })

    it('converts 50 cN to 500 mN', () => {
      expect(convertTear(50, 'cN')).toBe(500)
    })
  })

  describe('mN (identity)', () => {
    it('returns same value for mN input', () => {
      expect(convertTear(500, 'mN')).toBe(500)
    })
  })

  describe('edge cases', () => {
    it('handles zero', () => {
      expect(convertTear(0, 'gf')).toBe(0)
    })

    it('throws for negative values', () => {
      expect(() => convertTear(-1, 'cN')).toThrow()
    })

    it('throws for invalid unit', () => {
      expect(() => convertTear(1, 'invalid' as TearUnit)).toThrow()
    })
  })
})

describe('precision and rounding', () => {
  it('handles very small thickness values', () => {
    expect(convertThickness(0.001, 'mm')).toBeCloseTo(1, 5)
  })

  it('handles large tensile values', () => {
    expect(convertTensile(100, 'kgf/15mm')).toBeCloseTo(65.4, 0)
  })

  it('maintains precision for tear conversion', () => {
    const gfValue = 32
    const expected = 32 * 9.80665
    expect(convertTear(gfValue, 'gf')).toBeCloseTo(expected, 2)
  })
})

describe('convertStiffness (to mN·m)', () => {
  describe('mN·m (identity)', () => {
    it('returns same value for mN·m input', () => {
      expect(convertStiffness(5.5, 'mN·m')).toBe(5.5)
    })
  })

  describe('gf·cm to mN·m', () => {
    it('converts 1 gf·cm to approximately 0.0981 mN·m', () => {
      expect(convertStiffness(1, 'gf·cm')).toBeCloseTo(0.0981, 4)
    })

    it('converts 100 gf·cm to approximately 9.81 mN·m', () => {
      expect(convertStiffness(100, 'gf·cm')).toBeCloseTo(9.81, 2)
    })
  })

  describe('mN·mm to mN·m', () => {
    it('converts 1000 mN·mm to 1 mN·m', () => {
      expect(convertStiffness(1000, 'mN·mm')).toBeCloseTo(1, 5)
    })

    it('converts 1 mN·mm to 0.001 mN·m', () => {
      expect(convertStiffness(1, 'mN·mm')).toBeCloseTo(0.001, 5)
    })
  })

  describe('edge cases', () => {
    it('handles zero', () => {
      expect(convertStiffness(0, 'gf·cm')).toBe(0)
    })

    it('throws for negative values', () => {
      expect(() => convertStiffness(-1, 'mN·m')).toThrow()
    })

    it('throws for invalid unit', () => {
      expect(() => convertStiffness(1, 'invalid' as StiffnessUnit)).toThrow()
    })
  })
})

describe('smoothness conversions (Bekk ↔ PPS)', () => {
  describe('bekkToPPS', () => {
    it('converts 100 Bekk seconds to approximately 4.02 PPS µm', () => {
      expect(bekkToPPS(100)).toBeCloseTo(4.02, 2)
    })

    it('converts 50 Bekk seconds to approximately 5.06 PPS µm', () => {
      expect(bekkToPPS(50)).toBeCloseTo(5.06, 2)
    })

    it('converts 200 Bekk seconds to approximately 3.19 PPS µm', () => {
      expect(bekkToPPS(200)).toBeCloseTo(3.19, 2)
    })

    it('throws for zero value', () => {
      expect(() => bekkToPPS(0)).toThrow()
    })

    it('throws for negative value', () => {
      expect(() => bekkToPPS(-10)).toThrow()
    })
  })

  describe('ppsToBekk', () => {
    it('converts 4.02 PPS µm to approximately 100 Bekk seconds', () => {
      expect(ppsToBekk(4.02)).toBeCloseTo(100, 0)
    })

    it('converts 5.06 PPS µm to approximately 50 Bekk seconds', () => {
      expect(ppsToBekk(5.06)).toBeCloseTo(50, 0)
    })

    it('throws for zero value', () => {
      expect(() => ppsToBekk(0)).toThrow()
    })

    it('throws for negative value', () => {
      expect(() => ppsToBekk(-5)).toThrow()
    })
  })

  describe('round-trip conversion', () => {
    it('Bekk → PPS → Bekk returns original value', () => {
      const originalBekk = 75
      const pps = bekkToPPS(originalBekk)
      const backToBekk = ppsToBekk(pps)
      expect(backToBekk).toBeCloseTo(originalBekk, 1)
    })

    it('PPS → Bekk → PPS returns original value', () => {
      const originalPPS = 4.5
      const bekk = ppsToBekk(originalPPS)
      const backToPPS = bekkToPPS(bekk)
      expect(backToPPS).toBeCloseTo(originalPPS, 2)
    })
  })
})

describe('getSmoothnessMethod', () => {
  it('returns Bekk for sec unit', () => {
    expect(getSmoothnessMethod('sec')).toBe('Bekk')
  })

  it('returns Bendtsen for ml/min unit', () => {
    expect(getSmoothnessMethod('ml/min')).toBe('Bendtsen')
  })

  it('returns PPS for µm unit', () => {
    expect(getSmoothnessMethod('µm')).toBe('PPS')
  })
})
