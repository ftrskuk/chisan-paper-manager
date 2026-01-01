# Paper Technical Data Manager (Chisan Paper) - Agent Guidelines

This document provides coding standards, build commands, and TDD workflows for AI agents working on this Next.js 14 + Supabase project.

---

## Build, Lint & Test Commands

### Development
```bash
npm run dev                    # Start Next.js dev server (http://localhost:3000)
npx supabase start            # Start local Supabase (required for DB access)
npm run test                  # Run tests in watch mode
npm run test:ui               # Run tests with Vitest UI
```

### Testing
```bash
npm test                                        # Run all tests in watch mode
npm test -- path/to/file.test.ts               # Run single test file
npm test -- --run                              # Run once (no watch)
npm test -- --coverage                         # Generate coverage report
npm test -- utils/unit-converters.test.ts      # Run specific test (unit converters)
vitest --reporter=verbose                      # Detailed test output
```

### Build & Quality
```bash
npm run build                 # Production build (must pass before deploy)
npm run lint                  # ESLint check
npm run format                # Format with Prettier
npm run format:check          # Check formatting without writing
npm run types:supabase        # Regenerate DB types from Supabase schema
```

### Database
```bash
npx supabase db reset         # Reset local DB (applies all migrations)
npx supabase db push          # Push migrations to remote
npx supabase migration new <name>  # Create new migration file
```

---

## CRITICAL: TDD Compliance

**You MUST follow Test-Driven Development for all business logic.**

### TDD Workflow (Red-Green-Refactor)
1. **RED**: Write a failing test first
   ```bash
   npm test -- path/to/feature.test.ts
   ```
2. **GREEN**: Write minimal code to pass the test
3. **REFACTOR**: Improve code while keeping tests green

### Mandatory TDD for:
- All utility functions (e.g., `utils/unit-converters.ts`)
- Form validation logic (`schemas/*.ts`)
- Server Actions data transformations
- Business logic calculations

### Example (Unit Conversion):
```typescript
// 1. Write test FIRST (utils/unit-converters.test.ts)
it('converts mm to µm', () => {
  expect(convertThickness(1, 'mm')).toBe(1000)
})

// 2. Run test (should FAIL)
npm test -- utils/unit-converters.test.ts

// 3. Implement function (utils/unit-converters.ts)
export function convertThickness(value: number, from: ThicknessUnit): number {
  return value * THICKNESS_TO_MICRON[from]
}

// 4. Run test (should PASS)
```

**DO NOT write implementation code before tests exist and fail.**

---

## Code Style Guidelines

### TypeScript
- **Strict Mode**: All code must pass `strict: true` TypeScript checks
- **Explicit Types**: Avoid `any`; use `unknown` or proper types
- **Type Imports**: Use `import type { ... }` for type-only imports
- **Enums**: Prefer `as const` objects or union types over enums

### Imports
```typescript
// Order: React -> Next.js -> External -> Internal (absolute) -> Relative
import { useState } from 'react'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { ProductForm } from './ProductForm'
```

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProductForm.tsx` |
| Utilities | camelCase | `unit-converters.ts` |
| Server Actions | camelCase + verb | `createProduct`, `updateProduct` |
| Types/Interfaces | PascalCase | `ProductFormData`, `ThicknessUnit` |
| Constants | UPPER_SNAKE_CASE | `THICKNESS_TO_MICRON` |

---

## Next.js 14 App Router Patterns

### Server vs Client Components
**Default to Server Components.** Only use Client Components for:
- State (`useState`, `useReducer`)
- Effects (`useEffect`)
- Browser APIs (`window`, `localStorage`)
- Event handlers (`onClick`, `onChange`)

```typescript
// Server Component (default)
export default async function ProductsPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('*')
  return <ProductList products={data} />
}

// Client Component (only when needed)
'use client'
export function ProductForm() {
  const [isLoading, setIsLoading] = useState(false)
}
```

### Async APIs (Next.js 15 Compatibility)
**Always await `params`, `searchParams`, `cookies()`, `headers()`**

```typescript
// Correct (Next.js 15 ready)
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}
```

### Server Actions
- Place in `actions.ts` files next to route
- Always use `'use server'` directive
- Use `revalidatePath()` after mutations
- Use `redirect()` for navigation after success

---

## Supabase Integration

### Client Separation
```typescript
// Server Components, Server Actions, Route Handlers
import { createClient } from '@/utils/supabase/server'
const supabase = await createClient()

// Client Components ('use client')
import { createClient } from '@/utils/supabase/client'
const supabase = createClient()
```

### Type Safety
```typescript
import { Database } from '@/types/database.types'
// Regenerate after schema changes: npm run types:supabase
```

### Row Level Security (RLS)
- ALL tables MUST have RLS enabled
- Use optimized pattern: `(select auth.uid()) = user_id`

---

## Authentication & Authorization

### Auth Provider
- **Google OAuth** only (via Supabase Auth)
- No email/password registration

### User Roles
| Role | Permissions |
|------|-------------|
| `admin` | Full CRUD on all data, manage categories, upload files |
| `viewer` | Read-only access to products and comparisons |

### Role Check Pattern
```typescript
// Server-side role check
const { data: { user } } = await supabase.auth.getUser()
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

if (profile?.role !== 'admin') {
  throw new Error('Unauthorized')
}
```

### Protected Routes
- All routes require authentication
- Admin-only routes: `/products/new`, `/products/[id]/edit`, `/settings`
- Viewer routes: `/products`, `/products/[id]`, `/products/compare`

---

## File Upload

### Configuration
- **Storage**: Supabase Storage (bucket: `spec-sheets`)
- **File Type**: PDF only
- **Max Size**: 10MB
- **Naming**: `{product_id}/{timestamp}_{original_filename}.pdf`

### Upload Pattern
```typescript
// Client Component upload
const file = event.target.files[0]
if (file.size > 10 * 1024 * 1024) {
  toast.error('File must be under 10MB')
  return
}
if (file.type !== 'application/pdf') {
  toast.error('Only PDF files allowed')
  return
}

const { data, error } = await supabase.storage
  .from('spec-sheets')
  .upload(`${productId}/${Date.now()}_${file.name}`, file)
```

### Storage RLS
- Authenticated users can read all files
- Only admin can upload/delete files

---

## Testing Standards

### File Placement
```
utils/unit-converters.ts
utils/unit-converters.test.ts          <- Same directory

app/products/new/actions.ts
app/products/new/__tests__/actions.test.ts  <- __tests__ folder
```

### Vitest Patterns
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Feature Name', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should describe expected behavior', () => {
    expect(actual).toBe(expected)
  })
})
```

### Coverage Thresholds
- **Lines**: 80%
- **Functions**: 80%

---

## Project-Specific Rules

### Unit Conversion Standards
**All values MUST be stored in standardized units:**

| Property | Storage Unit | Symbol |
|----------|--------------|--------|
| Thickness | micrometers | µm |
| Tensile Strength | kilonewtons per meter | kN/m |
| Tear Strength | millinewtons | mN |

```typescript
import { convertThickness, convertTensile, convertTear } from '@/utils/unit-converters'
const caliperInMicrons = convertThickness(1, 'mm') // 1000
```

**Note**: Conversion formulas are standardized in this project. When encountering unfamiliar units from different paper mills, consult with the team to add new conversion factors to the utility module.

### Product Categories
- **User-defined list** (not hardcoded)
- Stored in `categories` table
- Admin can add/edit/delete categories
- Examples: Kraft, Corrugating Medium, Testliner, Coated, Specialty

### Extra Specs (JSONB)
- **Freeform structure** - admin can add any key-value pairs
- Common properties: brightness, opacity, smoothness, porosity, moisture
- UI should allow dynamic field addition/removal
```typescript
// Example extra_specs structure
{
  "brightness": { "value": 85, "unit": "%" },
  "opacity": { "value": 92, "unit": "%" },
  "smoothness": { "value": 150, "unit": "ml/min" }
}
```

### Product Comparison
- **Cross-mill comparison**: Can compare products from different mills
- **Any category**: No restriction on comparing different categories
- **Maximum 10 products** per comparison session
- Comparison data displayed in table + Recharts visualization

### Database Constraints
| Field | Type | Constraint |
|-------|------|------------|
| gsm | INTEGER | > 0 |
| caliper | FLOAT | > 0 (stored in µm) |
| tensile_md/cd | FLOAT | >= 0, nullable (stored in kN/m) |
| tear_md/cd | FLOAT | >= 0, nullable (stored in mN) |

### Form Handling
- Use `react-hook-form` + `@hookform/resolvers/zod`
- Define schemas in `schemas/` directory
- Show real-time converted values to users
- **Manual entry only** - no bulk import or OCR

### Error Handling
```typescript
// Server Actions - let errors propagate to error boundary
try {
  await supabase.from('products').insert(data)
} catch (error) {
  console.error('Database error:', error)
  throw error
}

// Client Components - show user-friendly messages
try {
  await createProduct(data)
} catch (error) {
  toast.error('Failed to create product')
}
```

---

## File Organization

```
app/
  (auth)/                   # Auth routes (login, callback)
    login/
      page.tsx
    callback/
      route.ts              # OAuth callback handler
  (dashboard)/              # Protected routes with shared layout
    products/
      page.tsx              # Product list (viewer + admin)
      new/
        page.tsx            # Admin only
        actions.ts
        __tests__/
      [id]/
        page.tsx            # Product detail
        edit/
          page.tsx          # Admin only
      compare/
        page.tsx            # Comparison with Recharts
    settings/
      categories/
        page.tsx            # Admin: manage categories
    layout.tsx              # Auth check + navigation
components/
  ui/                       # shadcn components
  ProductForm.tsx
  ProductComparisonChart.tsx
  FileUpload.tsx
utils/
  supabase/
    server.ts
    client.ts
    middleware.ts           # Session refresh
  unit-converters.ts
  unit-converters.test.ts
schemas/
  product.schema.ts
  category.schema.ts
types/
  database.types.ts         # Generated (don't edit manually)
middleware.ts               # Root middleware for auth
```

### Database Tables
```
profiles        - id, role ('admin' | 'viewer'), created_at
categories      - id, name, created_at
products        - id, mill_name, name, category_id (FK), file_url, created_at
product_specs   - id, product_id (FK), gsm, caliper, tensile_*, tear_*, extra_specs
```

---

## Pre-Commit Checklist

- [ ] All tests pass (`npm test -- --run`)
- [ ] Coverage thresholds met (`npm test -- --coverage`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code is formatted (`npm run format:check`)
- [ ] Types are up-to-date (`npm run types:supabase` if schema changed)
- [ ] Build succeeds (`npm run build`)

---

**Last Updated**: 2025-12-31
**Stack**: Next.js 14, Supabase (Auth + Storage + DB), Tailwind CSS, shadcn/ui, Recharts, Vitest
**Auth**: Google OAuth | **Roles**: admin, viewer | **File Upload**: PDF, 10MB max
