# 치산 Paper Manager 리팩터링 계획

## 프로젝트 정보

- **스택**: Next.js 14 + Supabase + TypeScript
- **테스트**: Vitest (TDD 필수)
- **코딩 스타일**: AGENTS.md 참조

---

## 진행 현황

| Step   | 상태    | 소요 시간 | 설명                            |
| ------ | ------- | --------- | ------------------------------- |
| Step 1 | ✅ 완료 | ~15분     | Specs 유틸리티 추출             |
| Step 2 | ✅ 완료 | ~20분     | ProductForm 컴포넌트 분리       |
| Step 3 | ⏳ 대기 | 예상 30분 | 데이터 변환 로직 추출 및 테스트 |
| Step 4 | ⏳ 대기 | 예상 20분 | SpecVariantForm memo 적용       |

---

## Step 1: Specs 유틸리티 추출 ✅ 완료

**결과**:

- `utils/product-helpers.ts` 생성
- `utils/product-helpers.test.ts` 생성
- `lib/actions/product.ts`에서 중복 제거

---

## Step 2: ProductForm 컴포넌트 분리 ✅ 완료

**결과**:

- `product-form.tsx`: 365줄 → 178줄 (51% 감소)
- `spec-variant-form.tsx`: 177줄 (신규)
- `extra-specs-form.tsx`: 87줄 (신규)
- 테스트 26개 추가

---

## Step 3: 데이터 변환 로직 추출 및 테스트 (수정됨)

### 변경 이유

기존 계획: 서버 액션 전체를 mock해서 테스트 → Supabase mock 복잡, 유지보수 어려움

**새 계획**: 순수 데이터 변환 로직만 추출하여 단위 테스트

### 작업 내용

```bash
# 1. 데이터 변환 로직 추출
lib/utils/product-transformations.ts (NEW)
  - transformExtraSpecsToRecord(): key-value 배열 → Record 변환
  - transformFormDataToSpecs(): 폼 데이터 → DB 스펙 변환
  - parseNumericValue(): 문자열 → 숫자 변환 (7% → 7)

# 2. TDD로 테스트 작성
lib/utils/product-transformations.test.ts (NEW)
  - 각 변환 함수의 edge case 테스트
  - null/undefined 처리
  - 타입 변환 정확성

# 3. use-product-form.ts에서 추출한 로직 사용
```

### 예상 효과

- 비즈니스 로직 테스트 가능
- 서버 액션은 E2E 테스트로 검증 (Playwright)
- 코드 재사용성 향상

---

## Step 4: 성능 최적화 - 간소화 (수정됨)

### 변경 이유

기존 계획: ProductForm, ProductsTable 모두 memo 적용
→ ProductsTable은 서버 컴포넌트, memo 불필요

**새 계획**: 실제 필요한 곳만 최적화

### 작업 내용

```typescript
// SpecVariantForm에 memo 적용 (리스트에서 반복 렌더링됨)
import { memo } from 'react'

export const SpecVariantForm = memo(function SpecVariantForm(
  {
    // ...props
  }: SpecVariantFormProps
) {
  // 기존 코드
})
```

### 예상 효과

- 스펙 추가/삭제 시 불필요한 리렌더링 방지
- 복잡한 최적화 없이 적절한 성능 확보

---

## 매 단계 체크리스트

```bash
□ npm test -- --run          # 모든 테스트 통과
□ npm run lint               # ESLint 통과
□ npm run build              # 빌드 성공
```

---

## 최종 구조

```
lib/
├── actions/
│   ├── product.ts
│   └── tds-upload.ts
├── utils/
│   ├── product-helpers.ts ✅
│   ├── product-helpers.test.ts ✅
│   ├── product-transformations.ts (Step 3)
│   ├── product-transformations.test.ts (Step 3)
│   └── unit-converters.ts
└── validations/
    ├── product.ts
    └── product.test.ts

components/products/
├── product-form.tsx (178줄) ✅
├── spec-variant-form.tsx (177줄) ✅
├── spec-variant-form.test.tsx ✅
├── extra-specs-form.tsx (87줄) ✅
├── extra-specs-form.test.tsx ✅
├── products-table.tsx
└── use-product-form.ts
```

---

## 참고 문서

- `AGENTS.md` - 코딩 컨벤션 및 TDD 워크플로우
- `.refactoring-status.json` - 현재 진행 상태

---

**최종 수정**: 2026-01-05
**상태**: Step 1, 2 완료 / Step 3, 4 대기
