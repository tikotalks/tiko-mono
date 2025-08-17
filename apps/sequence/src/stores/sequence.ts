import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { sequenceService, type Sequence, type SequenceItem } from '../services/sequence.service'
import { useI18n } from '@tiko/ui'
import { useAuthStore } from '@tiko/core'

interface PlayState {
  sequenceId: string
  items: SequenceItem[]
  shuffledOrder: string[]
  completedItems: string[]
  currentIndex: number
  isComplete: boolean
  startTime: number
}

export const useSequenceStore = defineStore('sequence', () => {
  const { currentLocale } = useI18n()
  
  // State
  const sequences = shallowRef<Map<string, Sequence>>(new Map())
  const sequenceItems = shallowRef<Map<string, SequenceItem[]>>(new Map())
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Play state
  const playState = ref<PlayState | null>(null)
  
  // Getters
  const allSequences = computed(() => {
    return Array.from(sequences.value.values()).sort((a, b) => a.orderIndex - b.orderIndex)
  })
  
  const getSequence = computed(() => (id: string) => {
    return sequences.value.get(id)
  })
  
  const getSequenceItems = computed(() => (sequenceId: string) => {
    return sequenceItems.value.get(sequenceId) || []
  })
  
  const currentPlayItems = computed(() => {
    if (!playState.value) return []
    return playState.value.items
  })
  
  const shuffledPlayItems = computed(() => {
    if (!playState.value) return []
    return playState.value.shuffledOrder.map(id => 
      playState.value!.items.find(item => item.id === id)!
    )
  })
  
  const completedPlayItems = computed(() => {
    if (!playState.value) return []
    return playState.value.completedItems.map(id => 
      playState.value!.items.find(item => item.id === id)!
    )
  })
  
  const isPlayComplete = computed(() => {
    return playState.value?.isComplete || false
  })
  
  const playProgress = computed(() => {
    if (!playState.value) return 0
    return playState.value.completedItems.length / playState.value.items.length
  })
  
  // Actions
  const loadSequences = async (forceReload = false) => {
    const authStore = useAuthStore()
    const userId = authStore.user?.id
    if (!userId) return
    
    if (!forceReload && sequences.value.size > 0) {
      return // Already loaded
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      const loaded = await sequenceService.loadSequences(userId)
      const newMap = new Map<string, Sequence>()
      
      for (const sequence of loaded) {
        newMap.set(sequence.id, sequence)
      }
      
      sequences.value = newMap
    } catch (err) {
      console.error('[SequenceStore] Failed to load sequences:', err)
      error.value = 'Failed to load sequences'
    } finally {
      isLoading.value = false
    }
  }
  
  const loadSequenceItems = async (sequenceId: string, forceReload = false) => {
    if (!forceReload && sequenceItems.value.has(sequenceId)) {
      return // Already loaded
    }
    
    try {
      const items = await sequenceService.loadSequenceItems(sequenceId)
      const newMap = new Map(sequenceItems.value)
      newMap.set(sequenceId, items)
      sequenceItems.value = newMap
    } catch (err) {
      console.error(`[SequenceStore] Failed to load items for sequence ${sequenceId}:`, err)
      throw err
    }
  }
  
  const createSequence = async (sequence: Partial<Sequence>) => {
    const authStore = useAuthStore()
    const userId = authStore.user?.id
    if (!userId) throw new Error('User not authenticated')
    
    const created = await sequenceService.createSequence(userId, sequence)
    
    // Update local state
    const newMap = new Map(sequences.value)
    newMap.set(created.id, created)
    sequences.value = newMap
    
    return created
  }
  
  const updateSequence = async (sequenceId: string, updates: Partial<Sequence>) => {
    const updated = await sequenceService.updateSequence(sequenceId, updates)
    
    // Update local state
    const newMap = new Map(sequences.value)
    newMap.set(updated.id, updated)
    sequences.value = newMap
    
    return updated
  }
  
  const deleteSequence = async (sequenceId: string) => {
    await sequenceService.deleteSequence(sequenceId)
    
    // Update local state
    const newMap = new Map(sequences.value)
    newMap.delete(sequenceId)
    sequences.value = newMap
    
    // Also remove items from cache
    const newItemsMap = new Map(sequenceItems.value)
    newItemsMap.delete(sequenceId)
    sequenceItems.value = newItemsMap
  }
  
  const createSequenceItem = async (sequenceId: string, item: Partial<SequenceItem>) => {
    const created = await sequenceService.createSequenceItem(sequenceId, item)
    
    // Update local state
    const items = sequenceItems.value.get(sequenceId) || []
    const newItems = [...items, created].sort((a, b) => a.orderIndex - b.orderIndex)
    
    const newMap = new Map(sequenceItems.value)
    newMap.set(sequenceId, newItems)
    sequenceItems.value = newMap
    
    return created
  }
  
  const updateSequenceItem = async (itemId: string, updates: Partial<SequenceItem>) => {
    const updated = await sequenceService.updateSequenceItem(itemId, updates)
    
    // Update local state
    const newMap = new Map(sequenceItems.value)
    
    // Find and update the item in the correct sequence
    for (const [sequenceId, items] of newMap) {
      const index = items.findIndex(item => item.id === itemId)
      if (index >= 0) {
        items[index] = updated
        items.sort((a, b) => a.orderIndex - b.orderIndex)
        break
      }
    }
    
    sequenceItems.value = newMap
    
    return updated
  }
  
  const deleteSequenceItem = async (itemId: string) => {
    await sequenceService.deleteSequenceItem(itemId)
    
    // Update local state
    const newMap = new Map(sequenceItems.value)
    
    // Find and remove the item from the correct sequence
    for (const [sequenceId, items] of newMap) {
      const index = items.findIndex(item => item.id === itemId)
      if (index >= 0) {
        items.splice(index, 1)
        break
      }
    }
    
    sequenceItems.value = newMap
  }
  
  const reorderSequenceItems = async (sequenceId: string, itemIds: string[]) => {
    await sequenceService.reorderSequenceItems(sequenceId, itemIds)
    
    // Update local state
    const items = sequenceItems.value.get(sequenceId) || []
    const reorderedItems = itemIds.map((id, index) => {
      const item = items.find(i => i.id === id)!
      return { ...item, orderIndex: index }
    })
    
    const newMap = new Map(sequenceItems.value)
    newMap.set(sequenceId, reorderedItems)
    sequenceItems.value = newMap
  }
  
  // Play mode actions
  const startPlay = async (sequenceId: string) => {
    // Load items if not already loaded
    await loadSequenceItems(sequenceId)
    
    const items = sequenceItems.value.get(sequenceId) || []
    if (items.length === 0) {
      throw new Error('No items in sequence')
    }
    
    // Shuffle items for display
    const shuffledIds = [...items.map(i => i.id)].sort(() => Math.random() - 0.5)
    
    playState.value = {
      sequenceId,
      items,
      shuffledOrder: shuffledIds,
      completedItems: [],
      currentIndex: 0,
      isComplete: false,
      startTime: Date.now()
    }
  }
  
  const checkTap = (itemId: string): boolean => {
    if (!playState.value) return false
    
    const expectedItem = playState.value.items[playState.value.currentIndex]
    const isCorrect = expectedItem.id === itemId
    
    if (isCorrect) {
      // Add to completed items
      playState.value.completedItems.push(itemId)
      playState.value.currentIndex++
      
      // Check if sequence is complete
      if (playState.value.currentIndex >= playState.value.items.length) {
        playState.value.isComplete = true
      }
    }
    
    return isCorrect
  }
  
  const resetPlay = () => {
    if (!playState.value) return
    
    playState.value.completedItems = []
    playState.value.currentIndex = 0
    playState.value.isComplete = false
    playState.value.startTime = Date.now()
  }
  
  const endPlay = () => {
    playState.value = null
  }
  
  const clearCache = () => {
    sequences.value = new Map()
    sequenceItems.value = new Map()
    playState.value = null
  }
  
  return {
    // State
    sequences: computed(() => sequences.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    
    // Getters
    allSequences,
    getSequence,
    getSequenceItems,
    currentPlayItems,
    shuffledPlayItems,
    completedPlayItems,
    isPlayComplete,
    playProgress,
    
    // Actions
    loadSequences,
    loadSequenceItems,
    createSequence,
    updateSequence,
    deleteSequence,
    createSequenceItem,
    updateSequenceItem,
    deleteSequenceItem,
    reorderSequenceItems,
    
    // Play actions
    startPlay,
    checkTap,
    resetPlay,
    endPlay,
    
    // Utility
    clearCache
  }
})