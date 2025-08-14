/**
 * TypeScript interfaces for TInputText component
 * Provides type-safe props and configurations for text input functionality
 */

import type { Size, Status } from '../../../../types'

/**
 * Input mode type for different input behaviors on mobile devices
 */
export type InputMode = 
  | 'none' 
  | 'text' 
  | 'decimal' 
  | 'numeric' 
  | 'tel' 
  | 'search' 
  | 'email' 
  | 'url'

/**
 * Text input type variations
 */
export type TextInputType = 
  | 'text' 
  | 'password' 
  | 'email' 
  | 'url' 
  | 'tel' 
  | 'search'

/**
 * Props interface for TInputText component
 */
export interface TInputTextProps {
  /** Input label text */
  label?: string
  
  /** Placeholder text */
  placeholder?: string
  
  /** Description text shown below the label */
  description?: string
  
  /** Instructions text shown below the input */
  instructions?: string
  
  /** Whether the input is disabled */
  disabled?: boolean
  
  /** Array of error messages to display */
  error?: string[]
  
  /** Maximum number of errors to display */
  maxErrors?: number
  
  /** Input size variant */
  size?: Size
  
  /** Input status for visual feedback */
  status?: Status
  
  /** HTML input type */
  type?: TextInputType
  
  /** Pattern for input validation (regex or common patterns) */
  pattern?: string
  
  /** Maximum character length */
  maxlength?: number
  
  /** Minimum character length */
  minlength?: number
  
  /** Whether to autofocus on mount */
  autofocus?: boolean
  
  /** Input mode for mobile keyboards */
  inputmode?: InputMode
  
  /** Whether to show reset button when input has value */
  reset?: boolean
  
  /** Whether to show input controls */
  controls?: boolean
  
  /** Whether to auto-focus next input when max length is reached */
  autoFocusNext?: boolean
}

/**
 * Common text input patterns for validation
 */
export const TextInputPatterns = {
  /** Only numbers (0-9) */
  NUMERIC: '0-9',
  
  /** Letters and numbers */
  ALPHANUMERIC: 'A-Za-z0-9',
  
  /** Only letters */
  ALPHA: 'A-Za-z',
  
  /** Only uppercase letters */
  UPPERCASE: 'A-Z',
  
  /** Only lowercase letters */
  LOWERCASE: 'a-z',
  
  /** Letters, numbers, and common symbols */
  TEXT: 'A-Za-z0-9\\s\\-\\.\\_',
  
  /** Username pattern (letters, numbers, underscore, hyphen) */
  USERNAME: 'A-Za-z0-9\\_\\-',
  
  /** Phone number pattern */
  PHONE: '0-9\\+\\-\\(\\)\\s',
  
  /** Postal code pattern */
  POSTAL_CODE: 'A-Za-z0-9\\s\\-'
} as const

export type TextInputPattern = typeof TextInputPatterns[keyof typeof TextInputPatterns]