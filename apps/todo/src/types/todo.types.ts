export interface TodoGroup {
  id: string
  userId: string
  title: string
  icon?: string
  color?: string
  itemCount: number
  completedCount: number
  orderIndex: number
  createdAt: Date
  updatedAt: Date
}

export interface TodoItem {
  id: string
  groupId: string
  userId: string
  title: string
  imageUrl?: string
  completed: boolean
  orderIndex: number
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface CreateTodoGroupInput {
  title: string
  icon?: string
  color?: string
}

export interface CreateTodoItemInput {
  groupId: string
  title: string
  imageUrl?: string
}