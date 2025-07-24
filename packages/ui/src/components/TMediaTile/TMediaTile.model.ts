export interface MediaItem {
  id: string
  title?: string
  original_filename: string
  original_url: string
  file_size: number
  tags?: string[]
  categories?: string[]
}

export interface TMediaTileProps {
  media: MediaItem
  href?: string
  showOverlay?: boolean
  showId?: boolean
  getImageVariants?: (url: string) => {
    thumbnail: string
    medium: string
    large: string
    original: string
  }
}

export interface TMediaListProps {
  items: MediaItem[]
  getImageVariants?: (url: string) => {
    thumbnail: string
    medium: string
    large: string
    original: string
  }
}

export interface TViewToggleProps {
  modelValue: 'tiles' | 'list'
  tilesLabel?: string
  listLabel?: string
  tilesIcon?: string
  listIcon?: string
}

export type ViewMode = 'tiles' | 'list'