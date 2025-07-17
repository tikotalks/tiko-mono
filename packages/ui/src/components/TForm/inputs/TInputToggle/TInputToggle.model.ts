/**
 * TypeScript interfaces for TInputToggle component
 * Provides type-safe props and configurations for toggle switch functionality
 */

export interface TInputToggleProps {
  /**
   * The current toggle state
   */
  modelValue?: boolean
  
  /**
   * Label text displayed next to the toggle
   */
  label?: string
  
  /**
   * Whether the toggle is disabled
   * @default false
   */
  disabled?: boolean
  
  /**
   * Error messages to display
   * @default []
   */
  error?: string[]
  
  /**
   * Whether to show icon in the toggle dot
   * @default true
   */
  showIcon?: boolean
  
  /**
   * Size variant of the toggle
   */
  size?: 'small' | 'medium' | 'large'
  
  /**
   * Color when toggle is on
   * @default 'primary'
   */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  
  /**
   * Text labels for on/off states
   */
  labels?: {
    on?: string
    off?: string
  }
  
  /**
   * Whether the toggle is required
   * @default false
   */
  required?: boolean
  
  /**
   * Name attribute for form submission
   */
  name?: string
}

export interface TInputToggleEmits {
  /**
   * Emitted when toggle state changes
   */
  'update:modelValue': [value: boolean]
  
  /**
   * Emitted when the toggle state changes
   */
  change: [value: boolean]
  
  /**
   * Emitted when the toggle is touched/untouched
   */
  touched: [value: boolean]
  
  /**
   * Emitted when toggle gains focus
   */
  focus: [event: FocusEvent]
  
  /**
   * Emitted when toggle loses focus
   */
  blur: [event: FocusEvent]
}