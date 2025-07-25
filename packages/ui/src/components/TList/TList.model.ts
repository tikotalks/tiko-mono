export interface TListProps {
  columns?: TListColumn[]
  striped?: boolean
  bordered?: boolean
  hover?: boolean
}

export interface TListColumn {
  key: string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
}
