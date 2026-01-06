# 치산 Paper Manager 리팩터링 계획

## 프로젝트 정보

- **스택**: Next.js 14 + Supabase + TypeScript
- **테스트**: Vitest (TDD 필수)
- **코딩 스타일**: AGENTS.md 참조

---

## Phase 1 - 완료 ✅ (2026-01-05)

| Step   | 상태    | 소요 시간 | 설명                            |
| ------ | ------- | --------- | ------------------------------- |
| Step 1 | ✅ 완료 | ~15분     | Specs 유틸리티 추출             |
| Step 2 | ✅ 완료 | ~20분     | ProductForm 컴포넌트 분리       |
| Step 3 | ✅ 완료 | ~30분     | 데이터 변환 로직 추출 및 테스트 |
| Step 4 | ✅ 완료 | ~5분      | SpecVariantForm memo 적용       |

**결과 메트릭:**

- ProductForm: 365줄 → 178줄 (51% 감소)
- 테스트 추가: 62개 (26 component + 22 transformation + 14 spec-variant)
- 빌드: ✅ 성공
- 테스트: ✅ 146개 통과

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

## Step 3: 데이터 변환 로직 추출 및 테스트 ✅ 완료

**실제 작업:**

- `utils/product-transformations.ts` 생성
  - `parseNumericValue()`: 문자열 → 숫자 변환 ("123" → 123, "7%" → "7%")
  - `transformExtraSpecsToRecord()`: key-value 배열 → Record 객체
- `utils/product-transformations.test.ts` - 22개 테스트 (TDD)
  - edge cases: 빈 문자열, 공백, 과학적 표기법, 퍼센트 문자열
  - 중복 키 처리
- `components/products/use-product-form.ts` 리팩터링
  - 인라인 reduce 로직 제거
  - 추출한 순수 함수로 교체

**효과:**

- 비즈니스 로직 단위 테스트 가능
- 코드 재사용성 향상
- 타입 안정성 확보

---

## Step 4: 성능 최적화 ✅ 완료

**실제 작업:**

- `components/products/spec-variant-form.tsx`에 React.memo 적용
- 리스트 렌더링 최적화 (스펙 추가/삭제 시 불필요한 리렌더링 방지)

**검증:**

- 14개 테스트 통과
- 빌드 성공
- 기능 변경 없음

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
utils/
├── product-helpers.ts ✅
├── product-helpers.test.ts ✅
├── product-transformations.ts ✅
├── product-transformations.test.ts ✅
└── unit-converters.ts

components/products/
├── product-form.tsx (178줄) ✅
├── spec-variant-form.tsx (178줄) ✅
├── spec-variant-form.test.tsx ✅
├── extra-specs-form.tsx (87줄) ✅
├── extra-specs-form.test.tsx ✅
├── products-table.tsx
└── use-product-form.ts ✅

lib/
├── actions/
│   ├── product.ts ✅
│   └── tds-upload.ts
└── validations/
    ├── product.ts
    └── product.test.ts
```

---

## 참고 문서

- `AGENTS.md` - 코딩 컨벤션 및 TDD 워크플로우
- `.refactoring-status.json` - 진행 상태 추적

---

**완료 날짜**: 2026-01-05  
**상태**: Phase 1 완료 ✅
