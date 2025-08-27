export interface TInputRangeProps {
  modelValue?: number | string
  label?: string
  placeholder?: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  error?: string | string[]
  description?: string
  size?: 'small' | 'medium' | 'large'
  showValue?: boolean
  valuePosition?: 'left' | 'right'
  suffix?: string
  prefix?: string
}

export interface TInputRangeEmits {
  (e: 'update:modelValue', value: number): void
  (e: 'change', value: number): void
  (e: 'input', value: number): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
}