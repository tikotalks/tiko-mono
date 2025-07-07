export type ButtonType = 'default' | 'ghost' | 'fancy'
export type ButtonSize = 'small' | 'medium' | 'large'
export type ButtonColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
export type ButtonStatus = 'loading' | 'success' | 'error' | 'idle'

export interface TButtonProps {
  // Actions
  action?: () => void
  onLongPress?: () => void
  longPressTime?: number
  
  // Appearance
  type?: ButtonType
  size?: ButtonSize
  color?: ButtonColor
  status?: ButtonStatus
  
  // Content
  label?: string
  icon?: string
  iconPosition?: 'left' | 'right'
  
  // Behavior
  disabled?: boolean
  loading?: boolean
  vibrate?: boolean
  
  // HTML attributes
  htmlType?: 'button' | 'submit' | 'reset'
  
  // Router integration
  to?: string | Record<string, any>
  
  // Accessibility
  ariaLabel?: string
  ariaDescribedBy?: string
}

export interface LongPressState {
  isPressed: boolean
  timer: number | null
  startTime: number
}