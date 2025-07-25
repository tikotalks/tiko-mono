export interface MediaItem {
  id: string
  title?: string
  original_filename: string
  original_url: string
  file_size: number
  tags?: string[]
  categories?: string[]
  description?: string
  ai_analyzed?: boolean
  created_at?: string
  updated_at?: string
  type?: string
  width?: number
  height?: number
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