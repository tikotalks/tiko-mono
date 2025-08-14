import type { Icons } from 'open-icon'

export interface ProgressDialogDetailItem {
  label: string
  value: string | number
  type?: 'default' | 'success' | 'error' | 'warning'
}

export interface ProgressDialogProps {
  title: string
  progress: number
  total: number
  currentItem?: string
  statusText?: string
  successCount?: number
  errorCount?: number
  successLabel?: string
  errorLabel?: string
  details?: ProgressDialogDetailItem[]
  canCancel?: boolean
  cancelled?: boolean
  cancelLabel?: string
  showStats?: boolean
  icon?: Icons
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  indeterminate?: boolean
  onCancel?: () => void
}