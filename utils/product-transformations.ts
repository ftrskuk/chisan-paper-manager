export type ExtraSpecEntry = { key: string; value: string }

export function parseNumericValue(value: string): number | string {
  const trimmed = value.trim()

  if (trimmed === '') return value

  const numValue = Number(trimmed)

  if (isNaN(numValue)) return value
  if (!isFinite(numValue)) return value

  return numValue
}

export function transformExtraSpecsToRecord(
  entries: ExtraSpecEntry[]
): Record<string, unknown> {
  return entries.reduce(
    (acc, { key, value }) => {
      const trimmedKey = key.trim()
      if (trimmedKey) {
        acc[trimmedKey] = parseNumericValue(value)
      }
      return acc
    },
    {} as Record<string, unknown>
  )
}
