/**
 * Todo Store
 * 
 * @module stores/todo
 * @description
 * Todo store using the generic item service.
 * Provides todo-specific functionality for the Todo app.
 */

import { defineStore } from 'pinia'
import { useTodos } from '../composables/useTodos'

export const useTodoStore = defineStore('todo', () => {
  // Use the todos composable
  const todos = useTodos()
  
  // Re-export everything from the composable
  return {
    // State
    groups: todos.groups,
    items: todos.todoItems,
    loading: todos.loading,
    error: todos.error,
    
    // Computed
    todosByGroup: todos.todosByGroup,
    
    // Methods - renamed to match original store API
    loadGroups: todos.refreshItems,
    loadItems: todos.refreshItems,
    createGroup: todos.createGroup,
    createItem: async (groupId: string, content: string) => {
      return todos.createTodo(groupId, content)
    },
    updateGroup: async (groupId: string, updates: any) => {
      return todos.updateItem(groupId, updates)
    },
    updateItem: async (itemId: string, updates: any) => {
      return todos.updateItem(itemId, updates)
    },
    deleteGroup: todos.deleteItem,
    deleteItem: todos.deleteItem,
    toggleItem: todos.toggleTodo,
    toggleAllInGroup: todos.toggleAllInGroup,
    reorderGroups: async (groupIds: string[]) => {
      return todos.reorderItems(groupIds)
    },
    reorderItems: async (groupId: string, itemIds: string[]) => {
      return todos.reorderItems(itemIds, groupId)
    },
    
    // Helpers
    getGroupById: (id: string) => {
      return todos.groups.value.find(g => g.id === id)
    },
    getItemsByGroupId: (groupId: string) => {
      return todos.todosByGroup.value.get(groupId) || []
    },
    getGroupProgress: todos.getGroupProgress
  }
})