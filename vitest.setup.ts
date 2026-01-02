import '@testing-library/jest-dom'
import { beforeEach, vi } from 'vitest'

// Mock browser APIs for pdf-parse compatibility
Object.defineProperty(global, 'DOMMatrix', {
  value: class DOMMatrix {},
  writable: true,
})

Object.defineProperty(global, 'ImageData', {
  value: class ImageData {},
  writable: true,
})

Object.defineProperty(global, 'Path2D', {
  value: class Path2D {},
  writable: true,
})

beforeEach(() => {
  vi.clearAllMocks()
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))
