import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SpecVariantForm } from './spec-variant-form'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { ProductFormData } from '@/lib/validations/product'

type ExtraSpecEntry = { key: string; value: string }

describe('SpecVariantForm', () => {
  const mockRegister = vi.fn(
    () =>
      ({
        onChange: vi.fn(),
        onBlur: vi.fn(),
        name: 'test',
        ref: vi.fn(),
      }) as unknown as ReturnType<UseFormRegister<ProductFormData>>
  )

  const defaultProps = {
    index: 0,
    register: mockRegister as unknown as UseFormRegister<ProductFormData>,
    errors: {} as FieldErrors<ProductFormData>,
    extraSpecs: [] as ExtraSpecEntry[],
    showRemove: false,
    onRemove: vi.fn(),
    onAddExtraSpec: vi.fn(),
    onRemoveExtraSpec: vi.fn(),
    onUpdateExtraSpec: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders variant number badge', () => {
      render(<SpecVariantForm {...defaultProps} index={2} />)
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('renders all spec input fields', () => {
      render(<SpecVariantForm {...defaultProps} />)

      expect(screen.getByLabelText(/Base Weight/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Caliper/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Tensile MD/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Tensile CD/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Tear MD/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Tear CD/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Smoothness/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Stiffness MD/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Stiffness CD/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Brightness/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Cobb 60/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Density/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Opacity/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Moisture/i)).toBeInTheDocument()
    })

    it('shows remove button when showRemove is true', () => {
      render(<SpecVariantForm {...defaultProps} showRemove={true} />)
      expect(
        screen.getByRole('button', { name: /remove/i })
      ).toBeInTheDocument()
    })

    it('hides remove button when showRemove is false', () => {
      render(<SpecVariantForm {...defaultProps} showRemove={false} />)
      expect(
        screen.queryByRole('button', { name: /remove/i })
      ).not.toBeInTheDocument()
    })
  })

  describe('form registration', () => {
    it('calls register with correct field names', () => {
      render(<SpecVariantForm {...defaultProps} index={1} />)

      expect(mockRegister).toHaveBeenCalledWith('specs.1.gsm', {
        valueAsNumber: true,
      })
      expect(mockRegister).toHaveBeenCalledWith('specs.1.caliper', {
        valueAsNumber: true,
      })
      expect(mockRegister).toHaveBeenCalledWith('specs.1.tensile_md', {
        valueAsNumber: true,
      })
      expect(mockRegister).toHaveBeenCalledWith('specs.1.tensile_cd', {
        valueAsNumber: true,
      })
      expect(mockRegister).toHaveBeenCalledWith('specs.1.tear_md', {
        valueAsNumber: true,
      })
      expect(mockRegister).toHaveBeenCalledWith('specs.1.tear_cd', {
        valueAsNumber: true,
      })
      expect(mockRegister).toHaveBeenCalledWith('specs.1.smoothness', {
        valueAsNumber: true,
      })
      expect(mockRegister).toHaveBeenCalledWith('specs.1.stiffness_md', {
        valueAsNumber: true,
      })
      expect(mockRegister).toHaveBeenCalledWith('specs.1.stiffness_cd', {
        valueAsNumber: true,
      })
      expect(mockRegister).toHaveBeenCalledWith('specs.1.brightness', {
        valueAsNumber: true,
      })
      expect(mockRegister).toHaveBeenCalledWith('specs.1.cobb_60', {
        valueAsNumber: true,
      })
      expect(mockRegister).toHaveBeenCalledWith('specs.1.density', {
        valueAsNumber: true,
      })
      expect(mockRegister).toHaveBeenCalledWith('specs.1.opacity', {
        valueAsNumber: true,
      })
      expect(mockRegister).toHaveBeenCalledWith('specs.1.moisture', {
        valueAsNumber: true,
      })
    })
  })

  describe('error display', () => {
    it('displays GSM error message', () => {
      const errors: FieldErrors<ProductFormData> = {
        specs: [{ gsm: { type: 'required', message: 'GSM is required' } }],
      }
      render(<SpecVariantForm {...defaultProps} errors={errors} />)
      expect(screen.getByText('GSM is required')).toBeInTheDocument()
    })
  })

  describe('actions', () => {
    it('calls onRemove when remove button clicked', () => {
      const onRemove = vi.fn()
      render(
        <SpecVariantForm
          {...defaultProps}
          showRemove={true}
          onRemove={onRemove}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /remove/i }))
      expect(onRemove).toHaveBeenCalledTimes(1)
    })

    it('calls onAddExtraSpec when add extra spec button clicked', () => {
      const onAddExtraSpec = vi.fn()
      render(
        <SpecVariantForm {...defaultProps} onAddExtraSpec={onAddExtraSpec} />
      )

      fireEvent.click(screen.getByRole('button', { name: /add custom field/i }))
      expect(onAddExtraSpec).toHaveBeenCalledTimes(1)
    })
  })

  describe('extra specs section', () => {
    it('shows empty state when no extra specs', () => {
      render(<SpecVariantForm {...defaultProps} extraSpecs={[]} />)
      expect(
        screen.getByText(/no extra specifications added yet/i)
      ).toBeInTheDocument()
    })

    it('renders extra specs inputs when present', () => {
      const extraSpecs = [
        { key: 'moisture', value: '7%' },
        { key: 'brightness', value: '85' },
      ]
      render(<SpecVariantForm {...defaultProps} extraSpecs={extraSpecs} />)

      const keyInputs = screen.getAllByPlaceholderText(/key/i)
      const valueInputs = screen.getAllByPlaceholderText(/value/i)

      expect(keyInputs).toHaveLength(2)
      expect(valueInputs).toHaveLength(2)
      expect(keyInputs[0]).toHaveValue('moisture')
      expect(valueInputs[0]).toHaveValue('7%')
    })

    it('calls onUpdateExtraSpec when extra spec key changes', () => {
      const onUpdateExtraSpec = vi.fn()
      const extraSpecs = [{ key: 'moisture', value: '7%' }]
      render(
        <SpecVariantForm
          {...defaultProps}
          index={0}
          extraSpecs={extraSpecs}
          onUpdateExtraSpec={onUpdateExtraSpec}
        />
      )

      const keyInput = screen.getByDisplayValue('moisture')
      fireEvent.change(keyInput, { target: { value: 'humidity' } })

      expect(onUpdateExtraSpec).toHaveBeenCalledWith(0, 'key', 'humidity')
    })

    it('calls onUpdateExtraSpec when extra spec value changes', () => {
      const onUpdateExtraSpec = vi.fn()
      const extraSpecs = [{ key: 'moisture', value: '7%' }]
      render(
        <SpecVariantForm
          {...defaultProps}
          index={0}
          extraSpecs={extraSpecs}
          onUpdateExtraSpec={onUpdateExtraSpec}
        />
      )

      const valueInput = screen.getByDisplayValue('7%')
      fireEvent.change(valueInput, { target: { value: '8%' } })

      expect(onUpdateExtraSpec).toHaveBeenCalledWith(0, 'value', '8%')
    })

    it('calls onRemoveExtraSpec when remove extra spec button clicked', () => {
      const onRemoveExtraSpec = vi.fn()
      const extraSpecs = [{ key: 'moisture', value: '7%' }]
      render(
        <SpecVariantForm
          {...defaultProps}
          index={0}
          extraSpecs={extraSpecs}
          onRemoveExtraSpec={onRemoveExtraSpec}
        />
      )

      fireEvent.click(screen.getByTitle('Remove field'))
      expect(onRemoveExtraSpec).toHaveBeenCalledWith(0)
    })
  })
})
