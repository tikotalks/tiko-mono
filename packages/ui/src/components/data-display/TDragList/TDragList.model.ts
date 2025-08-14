export interface DragListItem {
  id: string
  parent_id?: string | null
  depth?: number
}

export interface TDragListProps<T extends DragListItem> {
  items: T[]
  enabled?: boolean
  hierarchical?: boolean
  onReorder?: (items: T[], parentChanges?: Array<{id: string, parentId: string | null}>) => void
}

export interface ParentChange {
  id: string
  parentId: string | null
}