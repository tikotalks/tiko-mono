/**
 * TypeScript interfaces for TInputRadio component
 * Provides type-safe props and configurations for radio input functionality
 */

export interface TInputRadioProps {
  /**
   * The current selected value (for radio group)
   */
  modelValue?: string
  
  /**
   * The value of this specific radio option
   */
  value: string
  
  /**
   * Label text displayed next to the radio
   */
  label: string
  
  /**
   * Name attribute to group radio buttons
   */
  name: string
  
  /**
   * Whether the radio is disabled
   * @default false
   */
  disabled?: boolean
  
  /**
   * Error messages to display
   * @default []
   */
  error?: string[]
  
  /**
   * Whether the radio is required
   * @default false
   */
  required?: boolean
  
  /**
   * Size variant of the radio
   */
  size?: 'small' | 'medium' | 'large'
  
  /**
   * Additional description for this option
   */
  description?: string
}

export interface TInputRadioEmits {
  /**
   * Emitted when value changes
   */
  'update:modelValue': [value: string]
  
  /**
   * Emitted when the radio is selected
   */
  change: [value: string]
  
  /**
   * Emitted when the radio is touched/untouched
   */
  touched: [value: boolean]
  
  /**
   * Emitted when radio gains focus
   */
  focus: [event: FocusEvent]
  
  /**
   * Emitted when radio loses focus
   */
  blur: [event: FocusEvent]
}

/**
 * Radio group configuration
 */
export interface TInputRadioGroupProps {
  /**
   * The selected value
   */
  modelValue?: string
  
  /**
   * Available options for the group
   */
  options: RadioOption[]
  
  /**
   * Name for the radio group
   */
  name: string
  
  /**
   * Layout direction
   * @default 'vertical'
   */
  direction?: 'horizontal' | 'vertical'
  
  /**
   * Whether all radios are disabled
   * @default false
   */
  disabled?: boolean
  
  /**
   * Whether selection is required
   * @default false
   */
  required?: boolean
  
  /**
   * Group label
   */
  label?: string
  
  /**
   * Size variant for all radios
   */
  size?: 'small' | 'medium' | 'large'
}

export interface RadioOption {
  /**
   * Display label for the option
   */
  label: string
  
  /**
   * Value of the option
   */
  value: string
  
  /**
   * Whether this specific option is disabled
   */
  disabled?: boolean
  
  /**
   * Additional description for the option
   */
  description?: string
}