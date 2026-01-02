# TDS Upload Feature - Implementation Plan

> Created: 2026-01-02
> Status: Ready for Implementation

---

## 1. Problem Statement

TDS(Technical Data Sheet) documents from different paper mills have:

- **Inconsistent key fields**: Each mill includes different properties
- **Different formats**: Tables, layouts, languages (EN/KO/CN/JP)
- **Various units**: Same property measured in different units
- **Manual entry pain**: Currently entering data manually via form

**Goal**: AI-assisted TDS upload that extracts data automatically, lets user verify/edit, then saves.

---

## 2. Solution Overview

### Flow

```
[PDF Drop] → [Storage Save] → [OpenAI GPT-4o Parse] → [Preview Table] → [User Edit] → [Save]
```

### Tech Stack

| Component       | Technology                                                               |
| --------------- | ------------------------------------------------------------------------ |
| AI Parsing      | **Anthropic Claude 3.5 Sonnet (Vision)** (best for PDF tables & visuals) |
| PDF Storage     | Supabase Storage (existing bucket)                                       |
| Frontend        | React + editable table component                                         |
| Unit Conversion | Extended unit-converters.ts                                              |

---

## 3. Database Schema Changes

### Migration: `20260102000000_add_tds_fields.sql`

```sql
-- Add core spec fields (priority order)
ALTER TABLE product_specs
  ADD COLUMN smoothness FLOAT,
  ADD COLUMN smoothness_unit TEXT DEFAULT 'sec/Bekk',
  ADD COLUMN stiffness_md FLOAT,
  ADD COLUMN stiffness_cd FLOAT,
  ADD COLUMN brightness FLOAT,
  ADD COLUMN cobb_60 FLOAT,
  ADD COLUMN density FLOAT,
  ADD COLUMN opacity FLOAT,
  ADD COLUMN moisture FLOAT;

-- Indexes for frequently filtered fields
CREATE INDEX idx_specs_brightness ON product_specs(brightness);
CREATE INDEX idx_specs_cobb ON product_specs(cobb_60);
CREATE INDEX idx_specs_smoothness ON product_specs(smoothness);
```

### Field Priority (Core Columns vs JSONB extra_specs)

**Core Columns (frequently filtered/compared):**

1. gsm (existing)
2. caliper (existing)
3. tensile_md/cd (existing)
4. tear_md/cd (existing)
5. smoothness + smoothness_unit (NEW)
6. stiffness_md/cd (NEW)
7. brightness (NEW)
8. cobb_60 (NEW)
9. density (NEW)
10. opacity (NEW) - for special papers like glassine
11. moisture (NEW)

**JSONB extra_specs (occasional use):**

- cie_whiteness
- ash_content
- scott_bond
- burst (for liner/medium)
- sct_cd (for liner/medium)
- Any other special properties

---

## 4. TypeScript Types Update

### `types/database.ts` additions

```typescript
export type SmoothnessMethod = 'Bekk' | 'Bendtsen' | 'PPS'
export type SmoothnessUnit = 'sec/Bekk' | 'ml/min/Bendtsen' | 'μm/PPS'

export interface ProductSpec {
  id: string
  product_id: string
  gsm: number
  caliper: number
  tensile_md: number | null
  tensile_cd: number | null
  tear_md: number | null
  tear_cd: number | null
  // NEW FIELDS
  smoothness: number | null
  smoothness_unit: SmoothnessUnit | null
  stiffness_md: number | null
  stiffness_cd: number | null
  brightness: number | null
  cobb_60: number | null
  density: number | null
  opacity: number | null
  moisture: number | null
  // Keep existing
  extra_specs: Record<string, unknown>
  created_at: string
}

// AI Parser output structure
export interface TDSParseResult {
  mill_name: string
  product_name: string
  category_hint: 'Kraft' | 'Liner' | 'Medium' | 'UWF' | 'Board' | 'Specialty'
  specs: TDSParsedSpec[]
  test_standards?: string[]
  notes?: string
}

export interface TDSParsedSpec {
  gsm: number
  caliper?: { value: number; unit: 'µm' | 'mm' | 'mil' }
  tensile_md?: { value: number; unit: 'kN/m' | 'kgf/15mm' | 'N/15mm' }
  tensile_cd?: { value: number; unit: 'kN/m' | 'kgf/15mm' | 'N/15mm' }
  tear_md?: { value: number; unit: 'mN' | 'gf' }
  tear_cd?: { value: number; unit: 'mN' | 'gf' }
  smoothness?: {
    value: number
    unit: 'sec' | 'ml/min' | 'μm'
    method: SmoothnessMethod
  }
  stiffness_md?: { value: number; unit: 'mN·m' }
  stiffness_cd?: { value: number; unit: 'mN·m' }
  brightness?: { value: number; unit: '%' }
  cobb_60?: { value: number; unit: 'g/m²' }
  density?: { value: number; unit: 'g/cm³' }
  opacity?: { value: number; unit: '%' }
  moisture?: { value: number; unit: '%' }
  extra_specs?: Record<string, unknown>
}
```

---

## 5. Unit Conversion Standards

### Smoothness

| Method   | Unit        | Direction         | ISO Standard |
| -------- | ----------- | ----------------- | ------------ |
| **Bekk** | seconds (s) | Higher = Smoother | ISO 5627     |
| Bendtsen | ml/min      | Lower = Smoother  | ISO 8791-2   |
| PPS      | μm          | Lower = Smoother  | ISO 8791-4   |

**Conversion (Bekk ↔ PPS only):**

```typescript
// Bekk to PPS
PPS_μm = 18.65 / (Bekk_seconds ^ (1 / 3))

// PPS to Bekk
Bekk_seconds = (18.65 / PPS_μm) ^ 3
```

**Note**: Bendtsen has no reliable conversion formula - store as-is.

### Add to `utils/unit-converters.ts`

```typescript
// Smoothness conversions
export function bekkToPPS(bekkSeconds: number): number {
  return 18.65 / Math.pow(bekkSeconds, 1 / 3)
}

export function ppsToBekk(ppsUm: number): number {
  return Math.pow(18.65 / ppsUm, 3)
}

// Stiffness (Taber 15°)
export type StiffnessUnit = 'mN·m' | 'gf·cm' | 'mN·mm'

const STIFFNESS_TO_MNM: Record<StiffnessUnit, number> = {
  'mN·m': 1,
  'gf·cm': 0.0981,
  'mN·mm': 0.001,
}

export function convertToStandardStiffness(
  value: number,
  unit: StiffnessUnit
): number {
  return value * STIFFNESS_TO_MNM[unit]
}
```

---

## 6. OpenAI API Integration

### File: `lib/ai/tds-parser.ts`

````typescript
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { TDSParseResult } from '@/types/database'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const TDS_PARSER_PROMPT = `
You are a paper industry TDS (Technical Data Sheet) parser.
Extract ALL specifications from this document.

Return JSON in this exact structure:
{
  "mill_name": "string",
  "product_name": "string",
  "category_hint": "Kraft" | "Liner" | "Medium" | "UWF" | "Board" | "Specialty",
  "specs": [
    {
      "gsm": number,
      "caliper": { "value": number, "unit": "µm" | "mm" | "mil" },
      "tensile_md": { "value": number, "unit": "kN/m" | "kgf/15mm" | "N/15mm" },
      "tensile_cd": { "value": number, "unit": "kN/m" | "kgf/15mm" | "N/15mm" },
      "tear_md": { "value": number, "unit": "mN" | "gf" },
      "tear_cd": { "value": number, "unit": "mN" | "gf" },
      "smoothness": { "value": number, "unit": "sec" | "ml/min" | "μm", "method": "Bekk" | "Bendtsen" | "PPS" },
      "stiffness_md": { "value": number, "unit": "mN·m" },
      "stiffness_cd": { "value": number, "unit": "mN·m" },
      "brightness": { "value": number, "unit": "%" },
      "cobb_60": { "value": number, "unit": "g/m²" },
      "density": { "value": number, "unit": "g/cm³" },
      "opacity": { "value": number, "unit": "%" },
      "moisture": { "value": number, "unit": "%" },
      "extra_specs": { "key": value, ... }
    }
  ],
  "test_standards": ["ISO 536", "ISO 1924-2", ...],
  "notes": "any special notes or conditions"
}

Rules:
1. Extract ALL GSM variants from the table
2. Keep original units - do not convert
3. For range values "120 ± 4%", use: { "value": 120, "tolerance_pct": 4 }
4. For minimum values "≥ 350", use: { "value": 350, "is_minimum": true }
5. If a field is not present, omit it (don't use null)
6. Parse multi-language documents (EN/KO/CN/JP)
7. Look for test method/standard references (ISO, JIS, TAPPI, etc.)
`

export async function parseTDSDocument(
  pdfBase64: string
): Promise<TDSParseResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })

  const result = await model.generateContent([
    { text: TDS_PARSER_PROMPT },
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBase64,
      },
    },
  ])

  const responseText = result.response.text()

  // Extract JSON from response (may be wrapped in markdown code blocks)
  const jsonMatch =
    responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
    responseText.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    throw new Error('Failed to parse AI response as JSON')
  }

  const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
  return parsed as TDSParseResult
}
````

---

## 7. New Files to Create

```
lib/
  ├── ai/
  │   └── tds-parser.ts              # OpenAI API integration
  ├── actions/
  │   └── tds-upload.ts              # Server Action for upload flow

components/
  ├── tds/
  │   ├── tds-upload-dropzone.tsx    # Drag-and-drop zone
  │   ├── tds-preview-table.tsx      # Editable preview table
  │   └── tds-parsing-status.tsx     # Loading/progress indicator

app/(dashboard)/
  └── products/
      └── upload/
          └── page.tsx               # New upload page route

utils/
  └── unit-converters.ts             # Extend with smoothness, stiffness
```

---

## 8. UI Design

### Upload Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: PDF Upload                                         │
│  ───────────────────────────────────────────────────────── │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │     📄 Drop TDS PDF here or click to browse        │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 2: AI Parsing                                         │
│  ───────────────────────────────────────────────────────── │
│  ⏳ Extracting specifications...                            │
│  ├── ✓ PDF saved to storage                                │
│  ├── ✓ Document structure analyzed                         │
│  └── ○ Parsing table data...                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Review & Edit                                      │
│  ───────────────────────────────────────────────────────── │
│  Mill: [Asia Symbol    ▼]  Product: [Premium Kraft   ]     │
│  Category: [Kraft      ▼]                                  │
│                                                             │
│  ┌──────┬────────┬──────────┬──────────┬─────────┬───────┐ │
│  │ GSM  │Caliper │Tensile MD│Tensile CD│ Tear MD │Tear CD│ │
│  │      │  (µm)  │ (kN/m)   │ (kN/m)   │  (mN)   │ (mN)  │ │
│  ├──────┼────────┼──────────┼──────────┼─────────┼───────┤ │
│  │  70  │  95    │   3.2    │   1.8    │   420   │  480  │ │ ← Click to edit
│  │  80  │  108   │   3.8    │   2.1    │   480   │  550  │ │
│  │ 100  │  135   │   4.5    │   2.6    │   580   │  670  │ │
│  └──────┴────────┴──────────┴──────────┴─────────┴───────┘ │
│                                                             │
│  ▼ Additional Specs                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Smoothness: 45 sec (Bekk)  │  Brightness: 82%       │  │
│  │ Cobb60: 28 g/m²            │  Moisture: 7%          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  📎 Original PDF: TDS_Premium_Kraft.pdf [Download]          │
│                                                             │
│        [ Cancel ]                    [ ✓ Save Product ]    │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Implementation Checklist

### Phase 1: Database & Types

- [ ] Create migration `20260102000000_add_tds_fields.sql`
- [ ] Run migration on local Supabase
- [ ] Update `types/database.ts` with new fields and AI types
- [ ] Regenerate Supabase types: `npm run types:supabase`

### Phase 2: Unit Converters

- [ ] Add smoothness conversion functions (Bekk ↔ PPS)
- [ ] Add stiffness conversion functions
- [ ] Write tests for new converters
- [ ] Run tests: `npm test -- utils/unit-converters.test.ts`

### Phase 3: AI Integration

- [x] Install Anthropic SDK: `npm install @anthropic-ai/sdk`
- [ ] Create `lib/ai/tds-parser.ts`
- [ ] Add `ANTHROPIC_API_KEY` to `.env.local`
- [ ] Test with sample TDS PDFs

### Phase 4: Server Actions

- [ ] Create `lib/actions/tds-upload.ts`
- [ ] Implement PDF upload to Supabase Storage
- [ ] Implement AI parsing call
- [ ] Implement save parsed data to database

### Phase 5: UI Components

- [ ] Create `components/tds/tds-upload-dropzone.tsx`
- [ ] Create `components/tds/tds-preview-table.tsx` (editable)
- [ ] Create `components/tds/tds-parsing-status.tsx`
- [ ] Create `app/(dashboard)/products/upload/page.tsx`

### Phase 6: Testing & Polish

- [ ] Test with various TDS formats (see sample PDFs)
- [ ] Handle edge cases (missing fields, unusual formats)
- [ ] Add loading states and error handling
- [ ] Run full test suite: `npm test -- --run`
- [ ] Build check: `npm run build`

---

## 10. Sample TDS Files for Testing

Location: `C:\Users\david\Downloads\drive-download-20260102T042428Z-3-001`

| File                                  | Type     | Language | Complexity            |
| ------------------------------------- | -------- | -------- | --------------------- |
| 20200917_SNP_TDS_MGP (2).pdf          | MG Kraft | EN       | Simple table          |
| Hokuetsu Kinmari V TDS.pdf            | UWF      | EN/JP    | Multi-column          |
| MONDI MG KRAFT_RIBBED KRAFT.pdf       | MG Kraft | EN       | Standard EU format    |
| GoldEast UWK TDS.pdf                  | UWK      | EN/CN    | Tolerance values      |
| 전주제지*에코*하이\_크라프트\_TDS.pdf | Kraft    | KO       | Korean format         |
| VISY KRAFT LINER TECHNICAL DATA.PDF   | Liner    | EN       | LTL/UTL ranges        |
| General Packaging Board.pdf           | Board    | EN       | Multi-layer structure |
| THERMAL 62GSM LT 48062.pdf            | Thermal  | EN       | Special properties    |

---

## 11. Environment Variables

Add to `.env.local`:

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Get key from: https://console.anthropic.com/

---

## 12. Cost Estimate

| Item                  | Cost             |
| --------------------- | ---------------- |
| Claude Vision per TDS | ~$0.01-0.03      |
| 200 TDS documents     | ~$2-6 total      |
| Supabase Storage      | Included in plan |

---

## 13. References

### AI Service Research Summary

- **OpenAI GPT-4o**: High accuracy, good CJK support, structured JSON output
- **Gemini 2.5 Pro**: 88% accuracy, best CJK support (alternative option)
- **Claude Sonnet 4.5**: 78% accuracy, best structure understanding (backup option)

### Smoothness Standards

- **ISO 5627**: Bekk method (primary smoothness standard)
- **ISO 8791-2**: Bendtsen method
- **ISO 8791-4**: PPS method
- Conversion: `PPS (μm) = 18.65 / (Bekk seconds)^(1/3)`

---

## Quick Start for New Session

```bash
# 1. Read this plan
cat docs/TDS_UPLOAD_PLAN.md

# 2. Start with Phase 1
# Create migration file, update types

# 3. Get OpenAI API key
# https://platform.openai.com/api-keys
```
