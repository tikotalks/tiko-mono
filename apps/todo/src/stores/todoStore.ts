import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Item, ItemType } from '@tiko/core'
import { useAuthStore, useItems, useI18n } from '@tiko/core'
import { BaseColors } from '@tiko/ui'

export interface TodoStep extends Item {
  status: 'todo' | 'done'
  order: number
  parentId: string
}

export interface Todo extends Item {
  steps?: TodoStep[]
}

export const useTodoStore = defineStore('todo', () => {
  const authStore = useAuthStore()
  const itemsComposable = useItems({
    appName: 'todo',
    autoLoad: true,
  })
  const { locale } = useI18n()

  const todos = ref<Todo[]>([])
  const selectedTodo = ref<Todo | null>(null)
  const viewMode = ref<'horizontal' | 'vertical'>('horizontal')

  // Filter todos from items
  const userTodos = computed(() => {
    return itemsComposable.items.value
      .filter(item => item.type === 'todo' && item.userId === authStore.user?.id)
      .map(todo => ({
        ...todo,
        steps: itemsComposable.items.value
          .filter(step => step.type === 'todo-step' && step.parentId === todo.id)
          .sort((a, b) => (a.order || 0) - (b.order || 0)) as TodoStep[],
      })) as Todo[]
  })

  const publicTodos = computed(() => {
    return itemsComposable.items.value
      .filter(item => item.type === 'todo' && item.public && !item.userId)
      .map(todo => ({
        ...todo,
        steps: itemsComposable.items.value
          .filter(step => step.type === 'todo-step' && step.parentId === todo.id)
          .sort((a, b) => (a.order || 0) - (b.order || 0)) as TodoStep[],
      })) as Todo[]
  })

  const allTodos = computed(() => {
    return [...userTodos.value, ...publicTodos.value]
  })

  // Load todos
  async function loadTodos() {
    await itemsComposable.loadItems()
  }

  // Create new todo with steps
  async function createTodo(todoData: {
    name: string
    image?: string
    color?: string
    steps: { name: string; image?: string }[]
  }) {
    const newTodo = await itemsComposable.createItem({
      type: 'todo' as ItemType,
      name: todoData.name,
      image: todoData.image || '',
      color: todoData.color || BaseColors.BLUE,
      public: false,
      userId: authStore.user?.id || '',
      translations: {
        [locale.value]: {
          name: todoData.name,
        },
      },
    })

    if (newTodo && todoData.steps.length > 0) {
      // Create steps
      for (let i = 0; i < todoData.steps.length; i++) {
        await itemsComposable.createItem({
          type: 'todo-step' as ItemType,
          name: todoData.steps[i].name,
          image: todoData.steps[i].image || '',
          color: todoData.color || BaseColors.BLUE,
          public: false,
          userId: authStore.user?.id || '',
          parentId: newTodo.id,
          order: i,
          status: 'todo',
          translations: {
            [locale.value]: {
              name: todoData.steps[i].name,
            },
          },
        })
      }
    }

    await loadTodos()
    return newTodo
  }

  // Update step status
  async function updateStepStatus(stepId: string, status: 'todo' | 'done') {
    const step = itemsComposable.items.value.find(item => item.id === stepId)
    if (step) {
      await itemsComposable.updateItem({
        ...step,
        status,
      })
      await loadTodos()
    }
  }

  // Delete todo and its steps
  async function deleteTodo(todoId: string) {
    // Delete all steps first
    const steps = itemsComposable.items.value.filter(
      item => item.type === 'todo-step' && item.parentId === todoId
    )
    for (const step of steps) {
      await itemsComposable.deleteItem(step.id)
    }

    // Delete the todo
    await itemsComposable.deleteItem(todoId)
    await loadTodos()
  }

  // Toggle view mode
  function toggleViewMode() {
    viewMode.value = viewMode.value === 'horizontal' ? 'vertical' : 'horizontal'
  }

  return {
    todos: allTodos,
    userTodos,
    publicTodos,
    selectedTodo,
    viewMode,
    loading: itemsComposable.loading,
    error: itemsComposable.error,
    loadTodos,
    createTodo,
    updateStepStatus,
    deleteTodo,
    toggleViewMode,
  }
})
