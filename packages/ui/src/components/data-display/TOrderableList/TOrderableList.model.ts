import type { TListProps } from '../TList/TList.model'

export interface TOrderableListProps<T extends { id: string }> extends TListProps {
  items?: T[]
  orderable?: boolean
  showReorderButton?: boolean
  onReorder?: (items: T[]) => void | Promise<void>
}