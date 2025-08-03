import { Size } from '../../types'
import type { ListAction } from '../TListItem/TListItem.model'

export interface TListCellProps {
  /** Content to display in the cell */
  content?: string | number
  /** Type of cell content for styling */
  type?: 'text' | 'image' | 'chips' | 'id' | 'size' | 'custom' | 'actions'
  /** Image source for image type cells */
  imageSrc?: string
  /** Alt text for images */
  imageAlt?: string
  /** Array of chip values for chips type */
  chips?: string[]
  /** Maximum number of chips to show before truncating */
  maxChips?: number
  /** Custom width for the cell */
  width?: string
  /** Whether the cell should be clickable */
  clickable?: boolean
  /** Loading state */
  loading?: boolean
  /** Should the item truncate */
  truncate?: boolean
  /** Actions to display in the cell (for 'actions' type) */
  actions?: ListAction[]
  /** Custom class for additional styling */
  size?: Size
}

export interface ChipData {
  label: string
  value: string
  color?: string
}
