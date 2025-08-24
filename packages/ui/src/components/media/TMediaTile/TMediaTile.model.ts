import type { ContextMenuItem } from '../../navigation/TContextMenu/ContextMenu.model'


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
  thumbnail_url?: string // For video thumbnails
  duration?: number // For video/audio duration in seconds
}


export interface TMediaTileProps {
  media?: MediaItem
  images?: MediaItem[] // For multiple images
  href?: string
  showOverlay?: boolean
  showId?: boolean
  title?: string // Custom title override
  description?: string // Custom description
  meta?: string // Additional meta info (e.g., "12 images")
  emptyIcon?: string // Icon to show when no images
  aspectRatio?: string // Aspect ratio like "3:2", "16:9", "1:1" (default)
  contextMenuItems?: Partial<ContextMenuItem>[] // Context menu items to show on hover
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
