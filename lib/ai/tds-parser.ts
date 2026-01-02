import { GoogleGenerativeAI } from '@google/generative-ai'
import type {
  TDSParseResult,
  TDSParsedSpec,
  CategoryHint,
  SmoothnessMethod,
  SmoothnessUnit,
  StiffnessUnit,
} from '@/types/database'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const EXTRACTION_PROMPT = `You are a paper industry expert. Extract technical specifications from this Technical Data Sheet (TDS) PDF.

IMPORTANT RULES:
1. Extract ALL GSM variants shown in the document as separate spec entries
2. Preserve the exact units shown in the document
3. For MD/CD values (Machine Direction/Cross Direction), extract both if available
4. Common unit mappings:
   - Thickness/Caliper: µm, mm, or mil
   - Tensile: kN/m, kgf/15mm, or N/15mm
   - Tear: mN or gf
   - Smoothness: sec (Bekk), ml/min (Bendtsen), or µm (PPS)
   - Stiffness: mN·m or gf·cm
   - Brightness, Opacity, Moisture: percentage (0-100)
   - Cobb 60: g/m²
   - Density: g/cm³

5. If a value is a range (e.g., "100-120"), use the midpoint
6. If units are not specified, make a reasonable assumption based on value magnitude
7. Category hints: Kraft (brown unbleached), Liner (for boxes), Medium (corrugating), UWF (uncoated white freesheet), Board (thick/rigid), Specialty (other)

Return a JSON object with this exact structure:
{
  "mill_name": "string - Name of the paper mill/manufacturer",
  "product_name": "string - Name of the paper product",
  "category_hint": "Kraft" | "Liner" | "Medium" | "UWF" | "Board" | "Specialty",
  "specs": [
    {
      "gsm": number,
      "caliper": { "value": number, "unit": "µm" | "mm" | "mil" } | null,
      "tensile_md": { "value": number, "unit": "kN/m" | "kgf/15mm" | "N/15mm" } | null,
      "tensile_cd": { "value": number, "unit": "kN/m" | "kgf/15mm" | "N/15mm" } | null,
      "tear_md": { "value": number, "unit": "mN" | "gf" } | null,
      "tear_cd": { "value": number, "unit": "mN" | "gf" } | null,
      "smoothness": { "value": number, "unit": "sec" | "ml/min" | "µm", "method": "Bekk" | "Bendtsen" | "PPS" } | null,
      "stiffness_md": { "value": number, "unit": "mN·m" | "gf·cm" | "mN·mm" } | null,
      "stiffness_cd": { "value": number, "unit": "mN·m" | "gf·cm" | "mN·mm" } | null,
      "brightness": number | null,
      "cobb_60": number | null,
      "density": number | null,
      "opacity": number | null,
      "moisture": number | null
    }
  ],
  "test_standards": ["string"] | null,
  "notes": "string" | null
}

Extract all available data. Return null for fields not found in the document.
ONLY return valid JSON, no markdown formatting.`

export async function parseTDSDocument(
  pdfBase64: string
): Promise<TDSParseResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-preview-05-20',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  })

  const result = await model.generateContent([
    { text: EXTRACTION_PROMPT },
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBase64,
      },
    },
  ])

  const responseText = result.response.text()
  const parsed = JSON.parse(responseText)

  return validateAndNormalize(parsed)
}

function validateAndNormalize(raw: unknown): TDSParseResult {
  const data = raw as Record<string, unknown>

  if (!data.mill_name || typeof data.mill_name !== 'string') {
    throw new Error('Missing or invalid mill_name')
  }
  if (!data.product_name || typeof data.product_name !== 'string') {
    throw new Error('Missing or invalid product_name')
  }
  if (!Array.isArray(data.specs) || data.specs.length === 0) {
    throw new Error('No specifications found in document')
  }

  const specs: TDSParsedSpec[] = data.specs.map(
    (spec: Record<string, unknown>, index: number) => {
      if (typeof spec.gsm !== 'number' || spec.gsm <= 0) {
        throw new Error(`Invalid GSM at spec index ${index}`)
      }

      const normalizedSpec: TDSParsedSpec = {
        gsm: spec.gsm as number,
      }

      if (spec.caliper && typeof spec.caliper === 'object') {
        const cal = spec.caliper as { value: number; unit: string }
        if (cal.value > 0) {
          normalizedSpec.caliper = {
            value: cal.value,
            unit: cal.unit as 'µm' | 'mm' | 'mil',
          }
        }
      }

      if (spec.tensile_md && typeof spec.tensile_md === 'object') {
        const t = spec.tensile_md as { value: number; unit: string }
        if (t.value > 0) {
          normalizedSpec.tensile_md = {
            value: t.value,
            unit: t.unit as 'kN/m' | 'kgf/15mm' | 'N/15mm',
          }
        }
      }

      if (spec.tensile_cd && typeof spec.tensile_cd === 'object') {
        const t = spec.tensile_cd as { value: number; unit: string }
        if (t.value > 0) {
          normalizedSpec.tensile_cd = {
            value: t.value,
            unit: t.unit as 'kN/m' | 'kgf/15mm' | 'N/15mm',
          }
        }
      }

      if (spec.tear_md && typeof spec.tear_md === 'object') {
        const t = spec.tear_md as { value: number; unit: string }
        if (t.value > 0) {
          normalizedSpec.tear_md = {
            value: t.value,
            unit: t.unit as 'mN' | 'gf',
          }
        }
      }

      if (spec.tear_cd && typeof spec.tear_cd === 'object') {
        const t = spec.tear_cd as { value: number; unit: string }
        if (t.value > 0) {
          normalizedSpec.tear_cd = {
            value: t.value,
            unit: t.unit as 'mN' | 'gf',
          }
        }
      }

      if (spec.smoothness && typeof spec.smoothness === 'object') {
        const s = spec.smoothness as {
          value: number
          unit: string
          method: string
        }
        if (s.value > 0) {
          normalizedSpec.smoothness = {
            value: s.value,
            unit: s.unit as SmoothnessUnit,
            method: s.method as SmoothnessMethod,
          }
        }
      }

      if (spec.stiffness_md && typeof spec.stiffness_md === 'object') {
        const s = spec.stiffness_md as { value: number; unit: string }
        if (s.value > 0) {
          normalizedSpec.stiffness_md = {
            value: s.value,
            unit: s.unit as StiffnessUnit,
          }
        }
      }

      if (spec.stiffness_cd && typeof spec.stiffness_cd === 'object') {
        const s = spec.stiffness_cd as { value: number; unit: string }
        if (s.value > 0) {
          normalizedSpec.stiffness_cd = {
            value: s.value,
            unit: s.unit as StiffnessUnit,
          }
        }
      }

      if (typeof spec.brightness === 'number' && spec.brightness >= 0) {
        normalizedSpec.brightness = spec.brightness
      }
      if (typeof spec.cobb_60 === 'number' && spec.cobb_60 >= 0) {
        normalizedSpec.cobb_60 = spec.cobb_60
      }
      if (typeof spec.density === 'number' && spec.density > 0) {
        normalizedSpec.density = spec.density
      }
      if (typeof spec.opacity === 'number' && spec.opacity >= 0) {
        normalizedSpec.opacity = spec.opacity
      }
      if (typeof spec.moisture === 'number' && spec.moisture >= 0) {
        normalizedSpec.moisture = spec.moisture
      }

      return normalizedSpec
    }
  )

  return {
    mill_name: data.mill_name as string,
    product_name: data.product_name as string,
    category_hint: (data.category_hint as CategoryHint) || 'Specialty',
    specs,
    test_standards: Array.isArray(data.test_standards)
      ? data.test_standards.filter((s): s is string => typeof s === 'string')
      : undefined,
    notes: typeof data.notes === 'string' ? data.notes : undefined,
  }
}

export class TDSParseError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'INVALID_PDF'
      | 'API_ERROR'
      | 'PARSE_ERROR'
      | 'RATE_LIMIT'
      | 'AUTH_ERROR',
    public readonly retryable: boolean = false
  ) {
    super(message)
    this.name = 'TDSParseError'
  }
}

export async function parseTDSWithRetry(
  pdfBase64: string,
  maxRetries = 2
): Promise<TDSParseResult> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await parseTDSDocument(pdfBase64)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      const message = lastError.message.toLowerCase()

      if (
        message.includes('rate') ||
        message.includes('429') ||
        message.includes('quota')
      ) {
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
        throw new TDSParseError(
          'Rate limit exceeded. Please try again later.',
          'RATE_LIMIT',
          true
        )
      }

      if (
        message.includes('401') ||
        message.includes('api key') ||
        message.includes('unauthorized')
      ) {
        throw new TDSParseError(
          'Invalid API key configuration',
          'AUTH_ERROR',
          false
        )
      }

      if (
        message.includes('invalid') ||
        message.includes('400') ||
        message.includes('bad request')
      ) {
        throw new TDSParseError(
          'Invalid PDF document or format',
          'INVALID_PDF',
          false
        )
      }

      throw new TDSParseError(
        `Failed to parse TDS: ${lastError.message}`,
        'PARSE_ERROR',
        attempt < maxRetries
      )
    }
  }

  throw new TDSParseError(
    `Failed after ${maxRetries + 1} attempts: ${lastError?.message}`,
    'API_ERROR',
    false
  )
}
