/**
 * Todo Store
 * 
 * @module stores/todo
 * @description
 * Todo store using the generic item service.
 * Provides todo-specific functionality for the Todo app.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useTodos } from '../composables/useTodos'
import type { UseTodosReturn } from '../composables/useTodos'
import { useTodoSettingsStore } from './todoSettings'

export const useTodoStore = defineStore('todo', () => {
  // Lazy initialization of todos composable
  let todos: UseTodosReturn | null = null
  const initialized = ref(false)
  
  // Initialize the todos composable lazily
  const initializeTodos = () => {
    if (!todos) {
      todos = useTodos()
      initialized.value = true
    }
    return todos
  }
  
  // Create reactive references that will be populated after initialization
  const groups = computed(() => initialized.value && todos ? todos.groups.value : [])
  const items = computed(() => initialized.value && todos ? todos.todoItems.value : [])
  const loading = computed(() => initialized.value && todos ? todos.loading.value : false)
  const error = computed(() => initialized.value && todos ? todos.error.value : null)
  const todosByGroup = computed(() => initialized.value && todos ? todos.todosByGroup.value : new Map())
  
  // Methods that initialize on first call
  const loadGroups = async () => {
    const t = initializeTodos()
    return t.refreshItems()
  }
  
  const loadItems = async () => {
    const t = initializeTodos()
    return t.refreshItems()
  }
  
  const createGroup = async (title: string) => {
    const t = initializeTodos()
    return t.createGroup(title)
  }
  
  const createItem = async (groupId: string, content: string) => {
    const t = initializeTodos()
    return t.createTodo(groupId, content)
  }
  
  const updateGroup = async (groupId: string, updates: any) => {
    const t = initializeTodos()
    return t.updateItem(groupId, updates)
  }
  
  const updateItem = async (itemId: string, updates: any) => {
    const t = initializeTodos()
    return t.updateItem(itemId, updates)
  }
  
  const deleteGroup = async (id: string) => {
    const t = initializeTodos()
    return t.deleteItem(id)
  }
  
  const deleteItem = async (id: string) => {
    const t = initializeTodos()
    return t.deleteItem(id)
  }
  
  const toggleItem = async (id: string) => {
    const t = initializeTodos()
    return t.toggleTodo(id)
  }
  
  const toggleAllInGroup = async (groupId: string) => {
    const t = initializeTodos()
    return t.toggleAllInGroup(groupId)
  }
  
  const reorderGroups = async (groupIds: string[]) => {
    const t = initializeTodos()
    return t.reorderItems(groupIds)
  }
  
  const reorderItems = async (groupId: string, itemIds: string[]) => {
    const t = initializeTodos()
    return t.reorderItems(itemIds, groupId)
  }
  
  const getGroupProgress = (groupId: string) => {
    const t = initializeTodos()
    return t.getGroupProgress(groupId)
  }
  
  // Helpers
  const getGroupById = (id: string) => {
    return groups.value.find(g => g.id === id)
  }
  
  const getItemsByGroupId = (groupId: string) => {
    return todosByGroup.value.get(groupId) || []
  }
  
  return {
    // State
    groups,
    items,
    loading,
    error,
    
    // Computed
    todosByGroup,
    
    // Methods
    loadGroups,
    loadItems,
    createGroup,
    createItem,
    updateGroup,
    updateItem,
    deleteGroup,
    deleteItem,
    toggleItem,
    toggleAllInGroup,
    reorderGroups,
    reorderItems,
    
    // Helpers
    getGroupById,
    getItemsByGroupId,
    getGroupProgress
  }
})