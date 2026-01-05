# 리팩터링 빠른 시작 가이드

## 상태 확인

```bash
cat .refactoring-status.json
npm test -- --run
```

## 진행 상황

| Step   | 상태    | 설명                      |
| ------ | ------- | ------------------------- |
| Step 1 | ✅ 완료 | Specs 유틸리티 추출       |
| Step 2 | ✅ 완료 | ProductForm 컴포넌트 분리 |
| Step 3 | ⏳ 대기 | 데이터 변환 로직 추출     |
| Step 4 | ⏳ 대기 | SpecVariantForm memo 적용 |

## 다음 단계

**AI에게 요청:**

```
Step 3부터 시작해줘
```

### Step 3: 데이터 변환 로직 추출 (~30분)

순수 함수로 데이터 변환 로직 추출하여 테스트 용이성 확보

작업 내용:

1. `lib/utils/product-transformations.ts` 생성
2. `transformExtraSpecsToRecord()` - key-value 배열 → Record
3. `parseNumericValue()` - 문자열 → 숫자 (7% → 7)
4. TDD로 테스트 작성

### Step 4: SpecVariantForm memo 적용 (~20분)

리스트 렌더링 최적화

작업 내용:

1. `spec-variant-form.tsx`에 `memo` 적용
2. 불필요한 리렌더링 방지

---

## 시작 예시

**사용자**:

```
Step 3부터 시작해줘
```

**AI 응답**:

1. TDD RED - product-transformations.test.ts 작성
2. TDD GREEN - product-transformations.ts 구현
3. REFACTOR - use-product-form.ts에서 로직 교체
4. 검증 (lint, test, build)

---

**현재: Step 1, 2 완료. Step 3, 4 남음.**
