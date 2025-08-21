import type { Icons } from 'open-icon'
import {  ButtonType } from '../../ui-elements/TButton';

export type ListActionType = 'view' | 'edit' | 'delete' | 'copy' | 'download' | 'share' | 'custom'

export interface ListAction {
  type: ListActionType
  label?: string
  icon?: Icons
  buttonType?: ButtonType
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  tooltip?: string
  handler?: (event: Event) => void
}

export interface TListItemProps {
  columns?: number
  href?: string
  tag?: 'div' | 'a' | 'button'
  clickable?: boolean
  selected?: boolean
  actions?: ListAction[]
}
