export interface TVirtualGridProps {
  items: any[]
  minItemWidth: number
  gap?: number
  rowGap?: number
  bufferRows?: number
  aspectRatio?: string // e.g. "1:1", "3:2", "16:9"
}

export interface TVirtualGridIntersectionProps {
  items: any[]
  minItemWidth: number
  gap?: number
  rowGap?: number
  overscan?: number // Number of items to render outside viewport
  aspectRatio?: string // e.g. "1:1", "3:2", "16:9"
}