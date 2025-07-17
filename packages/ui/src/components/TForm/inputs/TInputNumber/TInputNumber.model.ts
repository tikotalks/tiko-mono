/**
 * TypeScript interfaces for TInputNumber component
 * Provides type-safe props and configurations for numeric input functionality
 */

export interface TInputNumberProps {
  /**
   * The current value
   */
  modelValue?: number
  
  /**
   * Label text displayed above the input
   */
  label?: string
  
  /**
   * Minimum allowed value
   */
  min?: number
  
  /**
   * Maximum allowed value
   */
  max?: number
  
  /**
   * Step increment for the input
   * @default 1
   */
  step?: number
  
  /**
   * Input placeholder text
   */
  placeholder?: string
  
  /**
   * Whether the input is disabled
   * @default false
   */
  disabled?: boolean
  
  /**
   * Whether to show increment/decrement controls
   * @default true
   */
  controls?: boolean
  
  /**
   * Number of decimal places to display
   */
  decimals?: number
  
  /**
   * Whether to format the number with thousands separators
   * @default false
   */
  formatThousands?: boolean
}

export interface TInputNumberEmits {
  /**
   * Emitted when value changes
   */
  'update:modelValue': [value: number | undefined]
  
  /**
   * Emitted when the input value changes
   */
  change: [value: number | undefined]
  
  /**
   * Emitted when the input is touched/untouched
   */
  touched: [value: boolean]
  
  /**
   * Emitted when input gains focus
   */
  focus: [event: FocusEvent]
  
  /**
   * Emitted when input loses focus
   */
  blur: [event: FocusEvent]
}

/**
 * Utility function to parse string to number
 */
export function parseNumericValue(value: string, decimals?: number): number | undefined {
  // Remove any non-digit characters except minus sign and decimal point
  const sanitized = value.replace(/[^\d.-]/g, '')
  
  // Extract the first number (including decimal and negative)
  const match = sanitized.match(/-?\d+\.?\d*/)
  if (!match) return undefined
  
  const num = Number(match[0])
  if (isNaN(num)) return undefined
  
  // Apply decimal places if specified
  if (decimals !== undefined) {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }
  
  return num
}

/**
 * Utility function to format number for display
 */
export function formatNumericValue(
  value: number | undefined, 
  decimals?: number,
  formatThousands = false
): string {
  if (value === undefined || value === null) return ''
  
  let formatted = decimals !== undefined 
    ? value.toFixed(decimals)
    : value.toString()
  
  if (formatThousands) {
    const parts = formatted.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    formatted = parts.join('.')
  }
  
  return formatted
}