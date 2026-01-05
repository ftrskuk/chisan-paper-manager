import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExtraSpecsForm } from './extra-specs-form'

type ExtraSpecEntry = { key: string; value: string }

describe('ExtraSpecsForm', () => {
  const defaultProps = {
    extraSpecs: [] as ExtraSpecEntry[],
    onAdd: vi.fn(),
    onRemove: vi.fn(),
    onUpdate: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders section header with icon', () => {
      render(<ExtraSpecsForm {...defaultProps} />)
      expect(screen.getByText('Extra Specifications')).toBeInTheDocument()
    })

    it('renders add button', () => {
      render(<ExtraSpecsForm {...defaultProps} />)
      expect(
        screen.getByRole('button', { name: /add custom field/i })
      ).toBeInTheDocument()
    })

    it('shows empty state when no extra specs', () => {
      render(<ExtraSpecsForm {...defaultProps} extraSpecs={[]} />)
      expect(
        screen.getByText(/no extra specifications added yet/i)
      ).toBeInTheDocument()
    })

    it('hides empty state when extra specs exist', () => {
      render(
        <ExtraSpecsForm
          {...defaultProps}
          extraSpecs={[{ key: 'test', value: 'value' }]}
        />
      )
      expect(
        screen.queryByText(/no extra specifications added yet/i)
      ).not.toBeInTheDocument()
    })
  })

  describe('extra specs list', () => {
    it('renders all extra spec entries', () => {
      const extraSpecs = [
        { key: 'moisture', value: '7%' },
        { key: 'brightness', value: '85' },
        { key: 'opacity', value: '92%' },
      ]
      render(<ExtraSpecsForm {...defaultProps} extraSpecs={extraSpecs} />)

      expect(screen.getAllByPlaceholderText(/key/i)).toHaveLength(3)
      expect(screen.getAllByPlaceholderText(/value/i)).toHaveLength(3)
    })

    it('displays correct values in inputs', () => {
      const extraSpecs = [{ key: 'moisture', value: '7%' }]
      render(<ExtraSpecsForm {...defaultProps} extraSpecs={extraSpecs} />)

      expect(screen.getByDisplayValue('moisture')).toBeInTheDocument()
      expect(screen.getByDisplayValue('7%')).toBeInTheDocument()
    })

    it('renders remove button for each entry', () => {
      const extraSpecs = [
        { key: 'a', value: '1' },
        { key: 'b', value: '2' },
      ]
      render(<ExtraSpecsForm {...defaultProps} extraSpecs={extraSpecs} />)

      expect(screen.getAllByTitle('Remove field')).toHaveLength(2)
    })
  })

  describe('actions', () => {
    it('calls onAdd when add button clicked', () => {
      const onAdd = vi.fn()
      render(<ExtraSpecsForm {...defaultProps} onAdd={onAdd} />)

      fireEvent.click(screen.getByRole('button', { name: /add custom field/i }))
      expect(onAdd).toHaveBeenCalledTimes(1)
    })

    it('calls onUpdate with correct params when key changes', () => {
      const onUpdate = vi.fn()
      const extraSpecs = [{ key: 'old', value: 'val' }]
      render(
        <ExtraSpecsForm
          {...defaultProps}
          extraSpecs={extraSpecs}
          onUpdate={onUpdate}
        />
      )

      fireEvent.change(screen.getByDisplayValue('old'), {
        target: { value: 'new' },
      })
      expect(onUpdate).toHaveBeenCalledWith(0, 'key', 'new')
    })

    it('calls onUpdate with correct params when value changes', () => {
      const onUpdate = vi.fn()
      const extraSpecs = [{ key: 'key', value: 'oldVal' }]
      render(
        <ExtraSpecsForm
          {...defaultProps}
          extraSpecs={extraSpecs}
          onUpdate={onUpdate}
        />
      )

      fireEvent.change(screen.getByDisplayValue('oldVal'), {
        target: { value: 'newVal' },
      })
      expect(onUpdate).toHaveBeenCalledWith(0, 'value', 'newVal')
    })

    it('calls onRemove with correct index', () => {
      const onRemove = vi.fn()
      const extraSpecs = [
        { key: 'a', value: '1' },
        { key: 'b', value: '2' },
      ]
      render(
        <ExtraSpecsForm
          {...defaultProps}
          extraSpecs={extraSpecs}
          onRemove={onRemove}
        />
      )

      const removeButtons = screen.getAllByTitle('Remove field')
      fireEvent.click(removeButtons[1])
      expect(onRemove).toHaveBeenCalledWith(1)
    })
  })

  describe('multiple entries', () => {
    it('handles updates to correct entry when multiple exist', () => {
      const onUpdate = vi.fn()
      const extraSpecs = [
        { key: 'first', value: '1' },
        { key: 'second', value: '2' },
        { key: 'third', value: '3' },
      ]
      render(
        <ExtraSpecsForm
          {...defaultProps}
          extraSpecs={extraSpecs}
          onUpdate={onUpdate}
        />
      )

      fireEvent.change(screen.getByDisplayValue('second'), {
        target: { value: 'updated' },
      })
      expect(onUpdate).toHaveBeenCalledWith(1, 'key', 'updated')
    })
  })
})
