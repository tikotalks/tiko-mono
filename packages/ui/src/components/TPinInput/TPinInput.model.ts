export interface TPinInputProps {
  /**
   * The current PIN value (v-model)
   */
  modelValue: string
  
  /**
   * Length of the PIN (default: 4)
   */
  length?: number
  
  /**
   * Show the actual values instead of dots
   */
  showValue?: boolean
  
  /**
   * Mask the values with a character (requires showValue to be true)
   */
  mask?: boolean
  
  /**
   * Character to use for masking (default: •)
   */
  maskCharacter?: string
  
  /**
   * Disable the input
   */
  disabled?: boolean
  
  /**
   * Auto-focus the input on mount
   */
  autoFocus?: boolean
  
  /**
   * Auto-submit when PIN length is reached
   */
  autoSubmit?: boolean
  
  /**
   * Error state
   */
  error?: boolean
  
  /**
   * Size variant
   */
  size?: 'small' | 'medium' | 'large'
}

export interface TPinInputEmits {
  /**
   * Update the model value
   */
  'update:modelValue': [value: string]
  
  /**
   * Emitted when the value changes
   */
  'change': [value: string]
  
  /**
   * Emitted when the PIN is complete (length reached)
   */
  'complete': [value: string]
  
  /**
   * Emitted when the input gains focus
   */
  'focus': []
  
  /**
   * Emitted when the input loses focus
   */
  'blur': []
}