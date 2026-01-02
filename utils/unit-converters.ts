export type ThicknessUnit = 'mm' | 'mil' | 'inch' | 'µm'
export type TensileUnit = 'kgf/15mm' | 'N/15mm' | 'lb/in' | 'kN/m'
export type TearUnit = 'gf' | 'cN' | 'mN'

const THICKNESS_TO_MICRON: Record<ThicknessUnit, number> = {
  mm: 1000,
  mil: 25.4,
  inch: 25400,
  µm: 1,
}

const TENSILE_TO_KN_M: Record<TensileUnit, number> = {
  'kgf/15mm': 9.80665 / 0.015 / 1000,
  'N/15mm': 1 / 0.015 / 1000,
  'lb/in': 4.44822 / 0.0254 / 1000,
  'kN/m': 1,
}

const TEAR_TO_MN: Record<TearUnit, number> = {
  gf: 9.80665,
  cN: 10,
  mN: 1,
}

export function convertThickness(value: number, from: ThicknessUnit): number {
  if (value < 0) {
    throw new Error('Value must be non-negative')
  }
  const factor = THICKNESS_TO_MICRON[from]
  if (factor === undefined) {
    throw new Error(`Invalid thickness unit: ${from}`)
  }
  return value * factor
}

export function convertTensile(value: number, from: TensileUnit): number {
  if (value < 0) {
    throw new Error('Value must be non-negative')
  }
  const factor = TENSILE_TO_KN_M[from]
  if (factor === undefined) {
    throw new Error(`Invalid tensile unit: ${from}`)
  }
  return value * factor
}

export function convertTear(value: number, from: TearUnit): number {
  if (value < 0) {
    throw new Error('Value must be non-negative')
  }
  const factor = TEAR_TO_MN[from]
  if (factor === undefined) {
    throw new Error(`Invalid tear unit: ${from}`)
  }
  return value * factor
}

export const convertToMicrometers = convertThickness
export const convertToKNPerMeter = convertTensile
export const convertToMillinewtons = convertTear

export type SmoothnessUnit = 'sec' | 'ml/min' | 'µm'
export type SmoothnessMethod = 'Bekk' | 'Bendtsen' | 'PPS'
export type StiffnessUnit = 'mN·m' | 'gf·cm' | 'mN·mm'

const STIFFNESS_TO_MNM: Record<StiffnessUnit, number> = {
  'mN·m': 1,
  'gf·cm': 0.0981,
  'mN·mm': 0.001,
}

export function convertStiffness(value: number, from: StiffnessUnit): number {
  if (value < 0) {
    throw new Error('Value must be non-negative')
  }
  const factor = STIFFNESS_TO_MNM[from]
  if (factor === undefined) {
    throw new Error(`Invalid stiffness unit: ${from}`)
  }
  return value * factor
}

export function bekkToPPS(bekkSeconds: number): number {
  if (bekkSeconds <= 0) {
    throw new Error('Bekk value must be positive')
  }
  return 18.65 / Math.pow(bekkSeconds, 1 / 3)
}

export function ppsToBekk(ppsUm: number): number {
  if (ppsUm <= 0) {
    throw new Error('PPS value must be positive')
  }
  return Math.pow(18.65 / ppsUm, 3)
}

export function getSmoothnessMethod(unit: SmoothnessUnit): SmoothnessMethod {
  switch (unit) {
    case 'sec':
      return 'Bekk'
    case 'ml/min':
      return 'Bendtsen'
    case 'µm':
      return 'PPS'
  }
}

export const convertToMNm = convertStiffness
