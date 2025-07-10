import type { DraggableItem } from '../../composables/useDraggable'

export interface TDraggableListProps<T extends DraggableItem = DraggableItem> {
  items: T[]
  enabled?: boolean
  onReorder?: (items: T[]) => void | Promise<void>
}

export type { DraggableItem }