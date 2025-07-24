export interface TViewToggleProps {
  modelValue: 'tiles' | 'list'
  tilesLabel?: string
  listLabel?: string
  tilesIcon?: string
  listIcon?: string
  size?: 'small' | 'medium' | 'large'
}

export type ViewMode = 'tiles' | 'list'