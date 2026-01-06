export interface ProductFilters {
  // Text search
  search?: string

  // Category and mill filters
  categoryIds?: string[]
  millNames?: string[]

  // GSM range
  gsmMin?: number
  gsmMax?: number

  // Physical properties
  brightnessMin?: number
  brightnessMax?: number
  opacityMin?: number
  opacityMax?: number
  caliperMin?: number
  caliperMax?: number
  densityMin?: number
  densityMax?: number

  // Strength properties
  tensileMdMin?: number
  tensileMdMax?: number
  tensileCdMin?: number
  tensileCdMax?: number
  tearMdMin?: number
  tearMdMax?: number
  tearCdMin?: number
  tearCdMax?: number

  // Surface properties
  smoothnessMin?: number
  smoothnessMax?: number
  cobb60Min?: number
  cobb60Max?: number
  moistureMin?: number
  moistureMax?: number
}

export interface FilterOption {
  label: string
  value: string
}

export interface RangeFilterState {
  min: string
  max: string
}
