# Chisan Paper Manager

Next.js 14 + Supabase 기반 제지 제품 관리 시스템

## 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **데이터베이스**: Supabase (PostgreSQL)
- **언어**: TypeScript (strict mode)
- **스타일링**: Tailwind CSS + shadcn/ui
- **테스트**: Vitest (TDD)
- **인증**: Supabase Auth

## 시작하기

### 필수 조건

- Node.js 18+
- npm 또는 yarn
- Supabase CLI

### 설치

```bash
npm install
```

### 환경 변수

`.env.local` 파일 생성:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 개발 서버 실행

```bash
# Supabase 로컬 시작
npx supabase start

# Next.js 개발 서버
npm run dev
```

http://localhost:3000 에서 확인

## 개발 가이드

### 코딩 컨벤션

전체 규칙은 `AGENTS.md` 참조

**핵심 원칙:**

- TDD (Test-Driven Development) 필수
- TypeScript strict mode (no `any`)
- Prettier 포맷팅 (세미콜론 없음, 싱글 쿼트)
- 서버 컴포넌트 우선 사용

### 테스트

```bash
# 전체 테스트 (watch 모드)
npm test

# 전체 테스트 (run once)
npm test -- --run

# 특정 파일 테스트
npm test -- path/to/file.test.ts

# 커버리지
npm test -- --coverage
```

### 빌드 & 품질 검사

```bash
# 프로덕션 빌드
npm run build

# Lint 검사
npm run lint

# 포맷팅 확인
npm run format:check

# 포맷팅 적용
npm run format
```

### Supabase 타입 생성

스키마 변경 후 타입 재생성:

```bash
npm run types:supabase
```

## 프로젝트 구조

```
app/                    # Next.js App Router
├── products/           # 제품 관련 페이지
├── categories/         # 카테고리 관리
└── auth/               # 인증 페이지

components/             # React 컴포넌트
├── products/           # 제품 관련 컴포넌트
└── ui/                 # shadcn/ui 컴포넌트

lib/                    # 핵심 로직
├── actions/            # Server Actions
└── validations/        # Zod 스키마

utils/                  # 유틸리티 함수
├── product-helpers.ts
├── product-transformations.ts
└── unit-converters.ts

supabase/
├── migrations/         # 데이터베이스 마이그레이션
└── seed.sql            # 시드 데이터
```

## 주요 기능

- ✅ 제품 CRUD (생성, 조회, 수정, 삭제)
- ✅ 다중 스펙 관리 (GSM, Caliper, Tensile, Tear 등)
- ✅ 동적 추가 스펙 (Extra Specs)
- ✅ 카테고리 관리
- ✅ PDF 파싱 및 업로드
- ✅ 제품 비교 기능

## 리팩터링 현황

Phase 1 완료 ✅ (2026-01-05)

상세 내용: `REFACTORING_PLAN.md` 참조

**주요 개선사항:**

- ProductForm: 365줄 → 178줄 (51% 감소)
- 컴포넌트 분리: SpecVariantForm, ExtraSpecsForm
- 순수 함수 추출: product-transformations.ts
- 테스트 추가: 62개
- React.memo 최적화 적용

## 문서

- `AGENTS.md` - AI 에이전트용 코딩 가이드라인
- `REFACTORING_PLAN.md` - 리팩터링 계획 및 진행 상황
- `.refactoring-status.json` - 자동 추적 상태 파일

## 라이센스

MIT
