import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@tiko/core'
import { useAuthStore } from '@tiko/core'
import type { TodoGroup, TodoItem, CreateTodoGroupInput, CreateTodoItemInput } from '../types/todo.types'

export const useTodoStore = defineStore('todo', () => {
  // State
  const groups = ref<TodoGroup[]>([])
  const items = ref<TodoItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const authStore = useAuthStore()

  // Getters
  const getGroupById = computed(() => (id: string) => {
    return groups.value.find(g => g.id === id)
  })

  const getItemsByGroupId = computed(() => (groupId: string) => {
    return items.value
      .filter(i => i.groupId === groupId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  })

  const getGroupProgress = computed(() => (groupId: string) => {
    const groupItems = getItemsByGroupId.value(groupId)
    const total = groupItems.length
    const completed = groupItems.filter(i => i.completed).length
    return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 }
  })

  // Load data from Supabase
  const loadGroups = async () => {
    if (!authStore.user) return
    
    loading.value = true
    error.value = null
    
    try {
      const { data, error: err } = await supabase
        .from('todo_groups')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('order_index', { ascending: true })
      
      if (err) throw err
      
      groups.value = data.map(g => ({
        ...g,
        id: g.id,
        userId: g.user_id,
        itemCount: g.item_count,
        completedCount: g.completed_count,
        orderIndex: g.order_index,
        createdAt: new Date(g.created_at),
        updatedAt: new Date(g.updated_at)
      })).sort((a, b) => a.orderIndex - b.orderIndex)
    } catch (err: any) {
      error.value = err.message
      console.error('Error loading groups:', err)
    } finally {
      loading.value = false
    }
  }

  const loadItems = async (groupId?: string) => {
    if (!authStore.user) return
    
    loading.value = true
    error.value = null
    
    try {
      let query = supabase
        .from('todo_items')
        .select('*')
        .eq('user_id', authStore.user.id)
      
      if (groupId) {
        query = query.eq('group_id', groupId)
      }
      
      const { data, error: err } = await query.order('order_index', { ascending: true })
      
      if (err) throw err
      
      const loadedItems = data.map(i => ({
        ...i,
        id: i.id,
        groupId: i.group_id,
        userId: i.user_id,
        imageUrl: i.image_url,
        orderIndex: i.order_index,
        createdAt: new Date(i.created_at),
        updatedAt: new Date(i.updated_at),
        completedAt: i.completed_at ? new Date(i.completed_at) : undefined
      }))
      
      if (groupId) {
        // Replace only items for this group
        items.value = items.value.filter(i => i.groupId !== groupId).concat(loadedItems)
      } else {
        items.value = loadedItems
      }
    } catch (err: any) {
      error.value = err.message
      console.error('Error loading items:', err)
    } finally {
      loading.value = false
    }
  }

  // Actions - Groups
  const createGroup = async (input: CreateTodoGroupInput): Promise<TodoGroup | null> => {
    if (!authStore.user) return null
    
    try {
      // Get the max order_index for this user
      const { data: existingGroups } = await supabase
        .from('todo_groups')
        .select('order_index')
        .eq('user_id', authStore.user.id)
        .order('order_index', { ascending: false })
        .limit(1)
      
      const maxOrder = existingGroups && existingGroups.length > 0 
        ? existingGroups[0].order_index 
        : -1
      
      const { data, error: err } = await supabase
        .from('todo_groups')
        .insert({
          user_id: authStore.user.id,
          title: input.title,
          icon: input.icon,
          color: input.color,
          item_count: 0,
          completed_count: 0,
          order_index: maxOrder + 1
        })
        .select()
        .single()
      
      if (err) throw err
      
      const newGroup: TodoGroup = {
        ...data,
        id: data.id,
        userId: data.user_id,
        itemCount: data.item_count,
        completedCount: data.completed_count,
        orderIndex: data.order_index,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
      
      groups.value.unshift(newGroup)
      return newGroup
    } catch (err: any) {
      error.value = err.message
      console.error('Error creating group:', err)
      return null
    }
  }

  const updateGroup = async (id: string, updates: Partial<TodoGroup>) => {
    try {
      const { error: err } = await supabase
        .from('todo_groups')
        .update({
          title: updates.title,
          icon: updates.icon,
          color: updates.color
        })
        .eq('id', id)
        .eq('user_id', authStore.user?.id)
      
      if (err) throw err
      
      const index = groups.value.findIndex(g => g.id === id)
      if (index !== -1) {
        groups.value[index] = {
          ...groups.value[index],
          ...updates,
          updatedAt: new Date()
        }
      }
    } catch (err: any) {
      error.value = err.message
      console.error('Error updating group:', err)
    }
  }

  const deleteGroup = async (id: string) => {
    try {
      const { error: err } = await supabase
        .from('todo_groups')
        .delete()
        .eq('id', id)
        .eq('user_id', authStore.user?.id)
      
      if (err) throw err
      
      // Remove from local state
      groups.value = groups.value.filter(g => g.id !== id)
      items.value = items.value.filter(i => i.groupId !== id)
    } catch (err: any) {
      error.value = err.message
      console.error('Error deleting group:', err)
    }
  }

  const resetGroupItems = async (id: string) => {
    try {
      const { error: err } = await supabase
        .from('todo_items')
        .update({
          completed: false,
          completed_at: null
        })
        .eq('group_id', id)
        .eq('user_id', authStore.user?.id)
      
      if (err) throw err
      
      // Update local state
      items.value = items.value.map(item => {
        if (item.groupId === id) {
          return {
            ...item,
            completed: false,
            completedAt: undefined,
            updatedAt: new Date()
          }
        }
        return item
      })
      
      // Update group counts
      const { error: groupErr } = await supabase
        .from('todo_groups')
        .update({ completed_count: 0 })
        .eq('id', id)
        .eq('user_id', authStore.user?.id)
      
      if (groupErr) throw groupErr
      
      const group = groups.value.find(g => g.id === id)
      if (group) {
        group.completedCount = 0
        group.updatedAt = new Date()
      }
    } catch (err: any) {
      error.value = err.message
      console.error('Error resetting group:', err)
    }
  }

  // Actions - Items
  const createItem = async (input: CreateTodoItemInput): Promise<TodoItem | null> => {
    if (!authStore.user) return null
    
    try {
      const groupItems = getItemsByGroupId.value(input.groupId)
      const maxOrder = groupItems.length > 0 
        ? Math.max(...groupItems.map(i => i.orderIndex)) 
        : -1

      const { data, error: err } = await supabase
        .from('todo_items')
        .insert({
          group_id: input.groupId,
          user_id: authStore.user.id,
          title: input.title,
          image_url: input.imageUrl,
          completed: false,
          order_index: maxOrder + 1
        })
        .select()
        .single()
      
      if (err) throw err
      
      const newItem: TodoItem = {
        ...data,
        id: data.id,
        groupId: data.group_id,
        userId: data.user_id,
        imageUrl: data.image_url,
        orderIndex: data.order_index,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
      
      items.value.push(newItem)
      
      // Update group counts
      const { error: groupErr } = await supabase
        .from('todo_groups')
        .update({ item_count: groupItems.length + 1 })
        .eq('id', input.groupId)
        .eq('user_id', authStore.user.id)
      
      if (!groupErr) {
        const group = groups.value.find(g => g.id === input.groupId)
        if (group) {
          group.itemCount++
          group.updatedAt = new Date()
        }
      }
      
      return newItem
    } catch (err: any) {
      error.value = err.message
      console.error('Error creating item:', err)
      return null
    }
  }

  const updateItem = async (id: string, updates: Partial<TodoItem>) => {
    try {
      const item = items.value.find(i => i.id === id)
      if (!item) return
      
      const wasCompleted = item.completed
      
      const { error: err } = await supabase
        .from('todo_items')
        .update({
          title: updates.title,
          image_url: updates.imageUrl,
          completed: updates.completed,
          completed_at: updates.completed ? new Date().toISOString() : null
        })
        .eq('id', id)
        .eq('user_id', authStore.user?.id)
      
      if (err) throw err
      
      // Update local state
      const index = items.value.findIndex(i => i.id === id)
      if (index !== -1) {
        items.value[index] = {
          ...items.value[index],
          ...updates,
          updatedAt: new Date()
        }
        
        if (updates.completed !== undefined) {
          items.value[index].completedAt = updates.completed ? new Date() : undefined
        }
      }
      
      // Update group counts if completion status changed
      if (updates.completed !== undefined && wasCompleted !== updates.completed) {
        const group = groups.value.find(g => g.id === item.groupId)
        if (group) {
          const newCount = updates.completed 
            ? group.completedCount + 1 
            : group.completedCount - 1
          
          const { error: groupErr } = await supabase
            .from('todo_groups')
            .update({ completed_count: newCount })
            .eq('id', item.groupId)
            .eq('user_id', authStore.user?.id)
          
          if (!groupErr) {
            group.completedCount = newCount
            group.updatedAt = new Date()
          }
        }
      }
    } catch (err: any) {
      error.value = err.message
      console.error('Error updating item:', err)
    }
  }

  const deleteItem = async (id: string) => {
    try {
      const item = items.value.find(i => i.id === id)
      if (!item) return
      
      const { error: err } = await supabase
        .from('todo_items')
        .delete()
        .eq('id', id)
        .eq('user_id', authStore.user?.id)
      
      if (err) throw err
      
      // Update group counts
      const group = groups.value.find(g => g.id === item.groupId)
      if (group) {
        const newItemCount = group.itemCount - 1
        const newCompletedCount = item.completed ? group.completedCount - 1 : group.completedCount
        
        const { error: groupErr } = await supabase
          .from('todo_groups')
          .update({ 
            item_count: newItemCount,
            completed_count: newCompletedCount 
          })
          .eq('id', item.groupId)
          .eq('user_id', authStore.user?.id)
        
        if (!groupErr) {
          group.itemCount = newItemCount
          group.completedCount = newCompletedCount
          group.updatedAt = new Date()
        }
      }
      
      // Remove from local state
      items.value = items.value.filter(i => i.id !== id)
      
      // Reorder remaining items
      const remainingItems = getItemsByGroupId.value(item.groupId)
      for (let i = 0; i < remainingItems.length; i++) {
        if (remainingItems[i].orderIndex !== i) {
          remainingItems[i].orderIndex = i
          await supabase
            .from('todo_items')
            .update({ order_index: i })
            .eq('id', remainingItems[i].id)
            .eq('user_id', authStore.user?.id)
        }
      }
    } catch (err: any) {
      error.value = err.message
      console.error('Error deleting item:', err)
    }
  }

  const toggleItemComplete = async (id: string) => {
    const item = items.value.find(i => i.id === id)
    if (item) {
      await updateItem(id, { completed: !item.completed })
    }
  }

  const reorderItems = async (groupId: string, itemIds: string[]) => {
    try {
      const updates = itemIds.map((itemId, index) => ({
        id: itemId,
        order_index: index
      }))
      
      // Update in database
      for (const update of updates) {
        await supabase
          .from('todo_items')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
          .eq('user_id', authStore.user?.id)
      }
      
      // Update local state
      itemIds.forEach((itemId, index) => {
        const item = items.value.find(i => i.id === itemId && i.groupId === groupId)
        if (item) {
          item.orderIndex = index
          item.updatedAt = new Date()
        }
      })
    } catch (err: any) {
      error.value = err.message
      console.error('Error reordering items:', err)
    }
  }

  const reorderGroups = async (groupIds: string[]) => {
    try {
      const updates = groupIds.map((groupId, index) => ({
        id: groupId,
        order_index: index
      }))
      
      // Update in database
      for (const update of updates) {
        await supabase
          .from('todo_groups')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
          .eq('user_id', authStore.user?.id)
      }
      
      // Update local state
      groupIds.forEach((groupId, index) => {
        const group = groups.value.find(g => g.id === groupId)
        if (group) {
          group.orderIndex = index
          group.updatedAt = new Date()
        }
      })
      
      // Re-sort groups
      groups.value.sort((a, b) => a.orderIndex - b.orderIndex)
    } catch (err: any) {
      error.value = err.message
      console.error('Error reordering groups:', err)
    }
  }

  return {
    // State
    groups,
    items,
    loading,
    error,
    
    // Getters
    getGroupById,
    getItemsByGroupId,
    getGroupProgress,
    
    // Actions
    loadGroups,
    loadItems,
    createGroup,
    updateGroup,
    deleteGroup,
    resetGroupItems,
    createItem,
    updateItem,
    deleteItem,
    toggleItemComplete,
    reorderItems,
    reorderGroups
  }
})