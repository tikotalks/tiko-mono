export interface TListProps {
  columns?: TListColumn[]
  striped?: boolean
  bordered?: boolean
  hover?: boolean
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (column: string, direction: 'asc' | 'desc') => void
}

export interface TListColumn {
  key: string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
}
