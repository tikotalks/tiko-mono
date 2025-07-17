/**
 * TypeScript interfaces for TInputCheckbox component
 * Provides type-safe props and configurations for checkbox input functionality
 */

export interface TInputCheckboxProps {
  /**
   * The current checked state
   */
  modelValue?: boolean
  
  /**
   * Label text displayed next to the checkbox
   */
  label?: string
  
  /**
   * Whether the checkbox is disabled
   * @default false
   */
  disabled?: boolean
  
  /**
   * Error messages to display
   * @default []
   */
  error?: string[]
  
  /**
   * Whether the checkbox is indeterminate (partially checked)
   * @default false
   */
  indeterminate?: boolean
  
  /**
   * Name attribute for the checkbox
   */
  name?: string
  
  /**
   * Value attribute for the checkbox (useful in checkbox groups)
   */
  value?: any
  
  /**
   * Whether the checkbox is required
   * @default false
   */
  required?: boolean
  
  /**
   * Size variant of the checkbox
   */
  size?: 'small' | 'medium' | 'large'
  
  /**
   * Color variant of the checkbox
   */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
}

export interface TInputCheckboxEmits {
  /**
   * Emitted when checked state changes
   */
  'update:modelValue': [value: boolean]
  
  /**
   * Emitted when the checkbox state changes
   */
  change: [value: boolean]
  
  /**
   * Emitted when the checkbox is touched/untouched
   */
  touched: [value: boolean]
  
  /**
   * Emitted when checkbox gains focus
   */
  focus: [event: FocusEvent]
  
  /**
   * Emitted when checkbox loses focus
   */
  blur: [event: FocusEvent]
}

/**
 * Checkbox group configuration
 */
export interface TInputCheckboxGroupProps {
  /**
   * Array of selected values
   */
  modelValue?: any[]
  
  /**
   * Available options for the group
   */
  options: CheckboxOption[]
  
  /**
   * Layout direction
   * @default 'vertical'
   */
  direction?: 'horizontal' | 'vertical'
  
  /**
   * Whether all checkboxes are disabled
   * @default false
   */
  disabled?: boolean
  
  /**
   * Whether all checkboxes are required
   * @default false
   */
  required?: boolean
  
  /**
   * Group label
   */
  label?: string
}

export interface CheckboxOption {
  /**
   * Display label for the option
   */
  label: string
  
  /**
   * Value of the option
   */
  value: any
  
  /**
   * Whether this specific option is disabled
   */
  disabled?: boolean
  
  /**
   * Additional description for the option
   */
  description?: string
}