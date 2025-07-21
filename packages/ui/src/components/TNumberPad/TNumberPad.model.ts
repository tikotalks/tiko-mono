import type { IconName } from 'open-icon'

export interface TNumberPadProps {
  /**
   * Show the clear/backspace button
   */
  showClear?: boolean

  /**
   * Show the submit/confirm button
   */
  showSubmit?: boolean

  /**
   * Disable all buttons
   */
  disabled?: boolean

  /**
   * Disable only the clear button
   */
  disableClear?: boolean

  /**
   * Disable only the submit button
   */
  disableSubmit?: boolean

  /**
   * Shuffle the numbers randomly
   */
  shuffle?: boolean

  /**
   * Size variant
   */
  size?: 'small' | 'medium' | 'large'

  /**
   * Visual variant
   */
  variant?: 'default' | 'compact' | 'rounded' | 'flat'

  /**
   * Icon to use for the clear button
   */
  clearIcon?: IconName | string

  /**
   * Icon to use for the submit button
   */
  submitIcon?: IconName | string
}

export interface TNumberPadEmits {
  /**
   * Emitted when a number is clicked
   */
  'number': [value: string]

  /**
   * Emitted when the clear button is clicked
   */
  'clear': []

  /**
   * Emitted when the submit button is clicked
   */
  'submit': []
}
