# TDS Upload Feature - Implementation Status

## Completed (Phase 1-8)

### Phase 1: Database Migration

- [x] `supabase/migrations/20260102000000_add_tds_fields.sql`
- Added: smoothness, smoothness_unit, stiffness_md, stiffness_cd, brightness, cobb_60, density, opacity, moisture

### Phase 2: Types

- [x] `types/database.ts` - Added ProductSpec new fields, TDSParseResult, TDSParsedSpec, TDSProductFormData

### Phase 3: Unit Converters

- [x] `utils/unit-converters.ts` - Added convertStiffness, bekkToPPS, ppsToBekk, getSmoothnessMethod
- [x] `utils/unit-converters.test.ts` - All 55 tests passing

### Phase 4: Dependencies

- [x] Installed: @anthropic-ai/sdk, react-dropzone

### Phase 5: AI Parser

- [x] `lib/ai/tds-parser.ts` - Claude Vision API with native PDF support

### Phase 6: Validation

- [x] `lib/validations/product.ts` - Added tdsSpecSchema, tdsProductFormSchema

### Phase 7: Server Actions

- [x] `lib/actions/tds-upload.ts` - uploadTDSPdf, parseTDS, saveTDSProduct, getStorageUrl, deleteStorageFile

### Phase 8: UI Components

- [x] `components/tds/tds-upload-dropzone.tsx`
- [x] `components/tds/tds-parsing-status.tsx`
- [x] `components/tds/tds-preview-table.tsx`

---

## TODO (Next Session)

### Phase 9: Page Routes

- [x] `app/(dashboard)/products/upload/page.tsx` - Server component
- [x] `app/(dashboard)/products/upload/client.tsx` - Client component with state machine
- [x] `app/(dashboard)/products/upload/loading.tsx`

### Phase 10: Navigation

- [x] Add "Upload TDS" link to sidebar or products page

### Phase 11: Testing & Polish

- [x] Run `npm run build` to verify no TypeScript errors
- [x] Create `lib/ai/tds-parser.test.ts` with mocks
- [x] Update `lib/validations/product.test.ts` for TDS fields
- [ ] Manual E2E test with real PDF

### Phase 12: Migration to Claude Vision (Completed)

- [x] Install `@anthropic-ai/sdk`
- [x] Uninstall `openai` and `unpdf` (no longer needed)
- [x] Refactor `lib/ai/tds-parser.ts` to use Claude Vision API
- [x] Update tests to mock Anthropic SDK
- [x] Verify build and tests

### Next Steps

- Set up `ANTHROPIC_API_KEY` in `.env.local`
- Navigate to `/products/upload`
- Upload a sample TDS PDF to verify end-to-end flow

---

## Environment Variables Required

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

---

## Why Claude Vision?

Previous implementation used `unpdf` + OpenAI GPT-4o:

1. `unpdf` extracted text from PDF (lost table structure)
2. GPT-4o parsed the flat text into JSON

Problems:

- TDS documents have complex tables that became mangled text
- Scanned PDFs couldn't be processed (no OCR)
- Two-step process lost structural information

Claude Vision solution:

- Sends PDF directly to Claude as base64
- Claude sees the document visually (preserves tables)
- Single API call, no intermediate text extraction
- Works with scanned PDFs too

---

## Bug Fix: TDS Form Validation (2026-01-03)

### Problem

TDS 업로드 후 "Save Product" 클릭 시 아무 반응 없음. 일부 TDS는 tensile_md 등 특정 필드가 없을 수 있는데, 빈 필드가 있으면 저장이 안 됨.

### Root Cause

react-hook-form + zodResolver 조합에서 nested object 등록 문제:

```tsx
// 문제가 된 코드
form.register(`specs.${index}.tensile_md.value`)
```

- `tensile_md`가 초기에 `null`일 때, 사용자가 값을 입력하면 `{ value: X }` 객체가 생성됨
- 하지만 `unit` 필드는 등록되지 않아 `{ value: X, unit: undefined }` 상태가 됨
- Zod 스키마는 `unit`이 `null` 또는 enum 값이어야 하는데, `undefined`는 허용 안 함
- 결과: silent validation failure, 폼 submit 안 됨

### Solution

**Flat 구조로 변경:**

```tsx
// Before (nested - 문제 발생)
interface Spec {
  tensile_md: { value: number | null; unit: string | null } | null
}
form.register(`specs.${index}.tensile_md.value`)

// After (flat - 해결)
interface FlatSpec {
  tensile_md_value: number | null
  tensile_md_unit: string // hidden, always has default
}
form.register(`specs.${index}.tensile_md_value`)
```

**수동 validation:**

```tsx
// zodResolver 제거, 수동으로 변환 후 validation
const handleFormSubmit = async (data: FormValues) => {
  const tdsData = convertFormToTDSData(data)  // flat → nested 변환
  const result = tdsProductFormSchema.safeParse(tdsData)
  if (!result.success) {
    setValidationError(result.error.errors.map(...).join(', '))
    return
  }
  await onSave(result.data)
}
```

### Files Changed

- `components/tds/tds-preview-table.tsx` - Flat form structure, manual validation
- `lib/validations/product.ts` - Simplified tdsSpecSchema
- `types/database.ts` - Removed duplicate TDSProductFormData
- `app/(dashboard)/products/upload/client.tsx` - Import path fix

### Lesson Learned

react-hook-form에서 optional nested object를 다룰 때:

1. Nested path 등록 (`a.b.c`) 시 중간 객체가 자동 생성되지만 형제 필드는 포함 안 됨
2. zodResolver는 validation 실패 시 에러를 조용히 처리 (기본적으로)
3. 복잡한 nested 구조보다 flat 구조 + 변환 함수가 더 안전함

---

## Quick Start for Next Session

```bash
cd /home/davidkuk/chisan-paper-manager

# Check current state
npm test -- --run
npm run build

# Test the upload flow
npm run dev
# Navigate to /products/upload
```
