/**
 * Todo-specific wrapper around the generic items composable
 * 
 * @module composables/useTodos
 * @description
 * Provides todo-specific functionality on top of the generic items system.
 */

import { computed, type ComputedRef } from 'vue'
import { useItems, type BaseItem } from '@tiko/core'

/**
 * Todo group (parent item)
 */
export interface TodoGroup extends BaseItem {
  type: 'todo_group'
}

/**
 * Todo item
 */
export interface TodoItem extends BaseItem {
  type: 'todo_item'
  parent_id: string // group ID
}

/**
 * Todo composable return type
 */
export interface UseTodosReturn {
  // All from useItems
  items: ReturnType<typeof useItems>['items']
  loading: ReturnType<typeof useItems>['loading']
  error: ReturnType<typeof useItems>['error']
  
  // Todo-specific computed
  groups: ComputedRef<TodoGroup[]>
  todoItems: ComputedRef<TodoItem[]>
  todosByGroup: ComputedRef<Map<string, TodoItem[]>>
  
  // Todo-specific methods
  createGroup: (name: string, icon?: string, color?: string) => Promise<TodoGroup | null>
  createTodo: (groupId: string, content: string) => Promise<TodoItem | null>
  toggleTodo: (todoId: string) => Promise<TodoItem | null>
  getGroupProgress: (groupId: string) => { total: number; completed: number; percentage: number }
  toggleAllInGroup: (groupId: string, completed: boolean) => Promise<void>
  
  // Re-export useful methods
  updateItem: ReturnType<typeof useItems>['updateItem']
  deleteItem: ReturnType<typeof useItems>['deleteItem']
  reorderItems: ReturnType<typeof useItems>['reorderItems']
  refreshItems: ReturnType<typeof useItems>['refreshItems']
}

/**
 * Todo composable
 * 
 * @returns Todo management interface
 * 
 * @example
 * const todos = useTodos()
 * 
 * // Create a group
 * const group = await todos.createGroup('Shopping List', '🛒')
 * 
 * // Add todos to the group
 * await todos.createTodo(group.id, 'Buy milk')
 * await todos.createTodo(group.id, 'Buy bread')
 * 
 * // Toggle a todo
 * await todos.toggleTodo(todoId)
 * 
 * // Get progress
 * const progress = todos.getGroupProgress(group.id)
 * console.log(`${progress.completed}/${progress.total} completed`)
 */
export function useTodos(): UseTodosReturn {
  // Use the generic items composable
  const items = useItems({
    appName: 'todo',
    autoLoad: true
  })
  
  // Todo-specific computed properties
  const groups = computed<TodoGroup[]>(() => 
    items.items.value.filter(item => item.type === 'todo_group') as TodoGroup[]
  )
  
  const todoItems = computed<TodoItem[]>(() => 
    items.items.value.filter(item => item.type === 'todo_item') as TodoItem[]
  )
  
  const todosByGroup = computed(() => {
    const map = new Map<string, TodoItem[]>()
    
    todoItems.value.forEach(todo => {
      if (!map.has(todo.parent_id)) {
        map.set(todo.parent_id, [])
      }
      map.get(todo.parent_id)!.push(todo)
    })
    
    // Sort todos within each group
    map.forEach(todos => {
      todos.sort((a, b) => a.order_index - b.order_index)
    })
    
    return map
  })
  
  // Todo-specific methods
  const createGroup = async (name: string, icon?: string, color?: string): Promise<TodoGroup | null> => {
    const result = await items.createItem({
      type: 'todo_group',
      name,
      icon,
      color
    })
    
    return result as TodoGroup | null
  }
  
  const createTodo = async (groupId: string, content: string): Promise<TodoItem | null> => {
    const result = await items.createItem({
      type: 'todo_item',
      name: content,
      content,
      parent_id: groupId,
      is_completed: false
    })
    
    return result as TodoItem | null
  }
  
  const toggleTodo = async (todoId: string): Promise<TodoItem | null> => {
    const result = await items.toggleComplete(todoId)
    return result as TodoItem | null
  }
  
  const getGroupProgress = (groupId: string): { total: number; completed: number; percentage: number } => {
    const groupTodos = todosByGroup.value.get(groupId) || []
    const total = groupTodos.length
    const completed = groupTodos.filter(todo => todo.is_completed).length
    const percentage = total > 0 ? (completed / total) * 100 : 0
    
    return { total, completed, percentage }
  }
  
  const toggleAllInGroup = async (groupId: string, completed: boolean): Promise<void> => {
    const groupTodos = todosByGroup.value.get(groupId) || []
    
    // Update all todos in parallel
    await Promise.all(
      groupTodos.map(todo => 
        items.updateItem(todo.id, { is_completed: completed })
      )
    )
  }
  
  return {
    // State
    items: items.items,
    loading: items.loading,
    error: items.error,
    
    // Todo-specific computed
    groups,
    todoItems,
    todosByGroup,
    
    // Todo-specific methods
    createGroup,
    createTodo,
    toggleTodo,
    getGroupProgress,
    toggleAllInGroup,
    
    // Re-export useful methods
    updateItem: items.updateItem,
    deleteItem: items.deleteItem,
    reorderItems: items.reorderItems,
    refreshItems: items.refreshItems
  }
}