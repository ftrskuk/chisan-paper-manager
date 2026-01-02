# Agent Guidelines - Chisan Paper Manager

Next.js 14 + Supabase + TypeScript project. Follow TDD strictly.

---

## Commands

### Testing (PRIORITY)

```bash
npm test                              # All tests, watch mode
npm test -- path/to/file.test.ts      # Single file (watch)
npm test -- --run                     # All tests, run once (CI)
npm test -- --run path/to/file.test.ts  # Single file, run once
npm test -- --coverage                # Coverage report
vitest --reporter=verbose             # Detailed output
```

### Build & Quality

```bash
npm run build          # Production build (MUST pass before deploy)
npm run lint           # ESLint check
npm run format         # Format with Prettier
npm run format:check   # Check formatting only
```

### Development

```bash
npm run dev            # Next.js dev server (localhost:3000)
npx supabase start     # Local Supabase (required for DB)
npx supabase db reset  # Reset local DB (applies migrations)
```

### Type Generation

```bash
npm run types:supabase  # Regenerate types from Supabase schema
# Run after ANY schema/migration change
```

---

## TDD Workflow (MANDATORY)

**Write tests FIRST for all business logic.**

1. **RED**: Write failing test
2. **GREEN**: Minimal code to pass
3. **REFACTOR**: Improve while green

```bash
# TDD cycle
npm test -- lib/validations/product.test.ts  # Watch specific file
```

### Mandatory TDD for:

- Utility functions (`utils/*.ts`)
- Validation schemas (`lib/validations/*.ts`)
- Data transformations in Server Actions
- Business logic calculations

### Test file placement:

```
utils/unit-converters.ts
utils/unit-converters.test.ts      # Same directory

lib/validations/product.ts
lib/validations/product.test.ts    # Same directory
```

---

## Code Style

### Formatting (Prettier)

- No semicolons
- Single quotes
- 2-space indentation
- Trailing commas (ES5)
- 80 char line width

### TypeScript

- `strict: true` - all code must pass
- NO `any` - use `unknown` or proper types
- NO `@ts-ignore` or `@ts-expect-error`
- Use `import type { ... }` for type-only imports
- Prefer `as const` objects over enums

### Import Order

```typescript
// 1. React
import { useState } from 'react'
// 2. Next.js
import { redirect } from 'next/navigation'
// 3. External packages
import { z } from 'zod'
// 4. Internal (absolute paths)
import { createClient } from '@/utils/supabase/server'
// 5. Relative
import { ProductForm } from './ProductForm'
```

### Naming Conventions

| Type             | Convention                        | Example                          |
| ---------------- | --------------------------------- | -------------------------------- |
| Components       | PascalCase                        | `ProductForm.tsx`                |
| Utilities        | kebab-case file, camelCase export | `unit-converters.ts`             |
| Server Actions   | verb prefix                       | `createProduct`, `updateProduct` |
| Types/Interfaces | PascalCase                        | `ProductFormData`                |
| Constants        | UPPER_SNAKE_CASE                  | `THICKNESS_TO_MICRON`            |

---

## Next.js Patterns

### Server vs Client Components

**Default to Server Components.** Use `'use client'` ONLY for:

- State (`useState`, `useReducer`)
- Effects (`useEffect`)
- Browser APIs (`window`, `localStorage`)
- Event handlers

### Async Params (Next.js 15 ready)

```typescript
// Always await params and searchParams
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
}
```

### Server Actions

- Place in `lib/actions/*.ts` or colocated `actions.ts`
- Use `'use server'` directive at file top
- Use `revalidatePath()` after mutations
- Use `redirect()` for post-success navigation

---

## Supabase

### Client Separation

```typescript
// Server (Components, Actions, Route Handlers)
import { createClient } from '@/utils/supabase/server'
const supabase = await createClient()

// Client ('use client' files only)
import { createClient } from '@/utils/supabase/client'
const supabase = createClient()
```

### Type Safety

```typescript
import type { Database } from '@/types/database'
// Regenerate: npm run types:supabase
```

---

## Error Handling

### Server Actions

```typescript
// Let errors propagate to error boundary
try {
  await supabase.from('products').insert(data)
} catch (error) {
  console.error('Database error:', error)
  throw error // Re-throw, don't swallow
}
```

### Client Components

```typescript
try {
  await createProduct(data)
} catch (error) {
  toast.error('Failed to create product')
}
```

### Forbidden Patterns

- Empty catch blocks: `catch(e) {}`
- Swallowing errors without logging
- Type coercion with `as any`

---

## Pre-Commit Checklist

- [ ] Tests pass: `npm test -- --run`
- [ ] Coverage met: `npm test -- --coverage` (80% lines/functions)
- [ ] Lint clean: `npm run lint`
- [ ] Formatted: `npm run format:check`
- [ ] Build passes: `npm run build`

---

## Quick Reference

| Task                 | Command                            |
| -------------------- | ---------------------------------- |
| Run single test file | `npm test -- path/to/file.test.ts` |
| Run tests once (CI)  | `npm test -- --run`                |
| Type check           | `npx tsc --noEmit`                 |
| Regenerate DB types  | `npm run types:supabase`           |

**Stack**: Next.js 14, Supabase, Tailwind, shadcn/ui, Vitest, Zod
