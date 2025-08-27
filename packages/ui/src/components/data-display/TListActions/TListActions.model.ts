import type { ListAction } from '../TListItem/TListItem.model'

export interface TListActionsProps {
  /** Array of actions to display */
  actions: ListAction[]
  /** Size of the action buttons */
  size?: 'small' | 'medium' | 'large'
  /** How to align the actions */
  alignment?: 'flex-start' | 'center' | 'flex-end' | 'space-between'
  /** Use compact spacing between buttons */
  compact?: boolean
}