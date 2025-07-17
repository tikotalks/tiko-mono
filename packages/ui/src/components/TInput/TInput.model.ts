export interface TInputProps {
  /**
   * The current value of the input
   */
  modelValue?: string | number
  
  /**
   * The type of input field
   * @default 'text'
   */
  type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url'
  
  /**
   * Label text displayed above the input
   */
  label?: string
  
  /**
   * Placeholder text shown when input is empty
   */
  placeholder?: string
  
  /**
   * Helper text displayed below the input
   */
  description?: string
  
  /**
   * Error message displayed below the input
   */
  error?: string
  
  /**
   * Whether the input is disabled
   * @default false
   */
  disabled?: boolean
  
  /**
   * Whether the input is readonly
   * @default false
   */
  readonly?: boolean
  
  /**
   * Whether the input is required
   * @default false
   */
  required?: boolean
  
  /**
   * Size variant of the input
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large'
  
  /**
   * Icon displayed at the start of the input
   */
  prefixIcon?: string
  
  /**
   * Icon displayed at the end of the input
   */
  suffixIcon?: string
  
  /**
   * Whether to show number spinners (for number type)
   * @default true
   */
  showSpinners?: boolean
  
  /**
   * Minimum value (for number type)
   */
  min?: number
  
  /**
   * Maximum value (for number type)
   */
  max?: number
  
  /**
   * Step value for number increment/decrement
   */
  step?: number
  
  /**
   * Custom aria-label for accessibility
   */
  ariaLabel?: string
}

export interface TInputEmits {
  /**
   * Emitted when the input value changes
   */
  'update:modelValue': [value: string | number]
  
  /**
   * Emitted when the input gains focus
   */
  focus: [event: FocusEvent]
  
  /**
   * Emitted when the input loses focus
   */
  blur: [event: FocusEvent]
  
  /**
   * Emitted when Enter key is pressed
   */
  enter: [event: KeyboardEvent]
}

export enum TInputSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export enum TInputType {
  TEXT = 'text',
  NUMBER = 'number',
  EMAIL = 'email',
  PASSWORD = 'password',
  TEL = 'tel',
  URL = 'url'
}