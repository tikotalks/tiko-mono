import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { useAppStore, useAuthStore, itemService } from '@tiko/core'
import { sequenceService } from '../services/sequence.service'
import { offlineStorageService } from '../services/sequence-offline-storage.service'
import type { TCardTile as CardTile } from '@tiko/ui'
import { useI18n } from '@tiko/ui'

export interface SequenceSettings {
  autoSpeak: boolean
  showHints: boolean
  hapticFeedback: boolean
}

interface CardCacheEntry {
  parentId?: string
  sequence: CardTile[]
  timestamp: number
  locale: string
}

interface PlayState {
  currentSequenceId: string | null
  shuffledItems: CardTile[]
  selectedItems: CardTile[]
  correctOrder: string[]
  isPlaying: boolean
  isComplete: boolean
}

export const useSequenceStore = defineStore('sequence', () => {
  const appStore = useAppStore()
  const authStore = useAuthStore()

  // Card cache - using shallowRef for better performance with large arrays
  const cardCache = shallowRef(new Map<string, CardCacheEntry>())
  const allSequenceLoaded = ref(false)
  const isLoadingSequence = ref(false)
  const hasOfflineData = ref(false)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes


  // Play state
  const playState = ref<PlayState>({
    currentSequenceId: null,
    shuffledItems: [],
    selectedItems: [],
    correctOrder: [],
    isPlaying: false,
    isComplete: false
  })

  // Settings with defaults
  const defaultSettings: SequenceSettings = {
    autoSpeak: true,
    showHints: false,
    hapticFeedback: true
  }

  // Getters
  const settings = computed((): SequenceSettings => {
    const appSettings = appStore.getAppSettings('sequence')
    return { ...defaultSettings, ...appSettings }
  })

  const currentPlayState = computed(() => playState.value)
  const isItemNext = computed(() => (itemId: string) => {
    if (!playState.value.isPlaying) return false
    const nextIndex = playState.value.selectedItems.length
    return playState.value.correctOrder[nextIndex] === itemId
  })

  const speakText = async (text: string) => {
    try {
      // Import useTextToSpeech dynamically
      const { useTextToSpeech } = await import('@tiko/ui')
      const tts = useTextToSpeech()

      // Speak with language-aware voice
      await tts.speak(text, {
        rate: 0.8,
        pitch: 1.0,
        volume: 1.0
      })
    } catch (error) {
      console.error('Failed to speak text:', error)
    }
  }

  const updateSettings = async (newSettings: Partial<SequenceSettings>) => {
    const currentSettings = settings.value
    const updatedSettings = { ...currentSettings, ...newSettings }

    await appStore.updateAppSettings('sequence', updatedSettings)
  }

  const saveState = async () => {
    await appStore.updateAppSettings('sequence', {
      ...settings.value
    })
  }


  const loadState = async () => {
    console.log('[SequenceStore] Loading state...')
    await appStore.loadAppSettings('sequence')

    const appSettings = appStore.getAppSettings('sequence')
    console.log('[SequenceStore] Retrieved settings:', appSettings)

    if (appSettings?.currentQuestion) {
      console.log('[SequenceStore] Loaded question:', appSettings.currentQuestion)
    } else {
      console.log('[SequenceStore] No saved question found, using default')
    }

    // Load questions from Items service
  }

  // Card loading with caching
  const getCacheKey = (parentId?: string, locale?: string) => {
    return `${parentId || 'root'}_${locale || 'default'}`
  }

  const isCacheValid = (entry: CardCacheEntry, locale: string) => {
    const now = Date.now()
    const isExpired = now - entry.timestamp > CACHE_DURATION
    const isLocaleMismatch = entry.locale !== locale
    return !isExpired && !isLocaleMismatch
  }

  const loadSequence = async (parentId?: string, locale?: string, forceRefresh = false): Promise<CardTile[]> => {
    const cacheKey = getCacheKey(parentId, locale)
    const cache = cardCache.value
    const userId = authStore.user?.id

    if (!userId) {
      console.warn('[SequenceStore] No user ID available')
      return []
    }

    // Check memory cache first
    if (!forceRefresh && cache.has(cacheKey)) {
      const entry = cache.get(cacheKey)!
      if (isCacheValid(entry, locale || 'default')) {
        console.log(`[SequenceStore] Returning cached sequence for ${cacheKey}`)
        return entry.sequence
      }
    }

    // If all sequence are loaded, we should have the data in cache
    if (allSequenceLoaded.value && !forceRefresh) {
      console.log(`[SequenceStore] All sequence loaded, but cache miss for ${cacheKey}. Returning empty array.`)
      // Cache the empty result to prevent future API calls
      const newCache = new Map(cache)
      newCache.set(cacheKey, {
        parentId,
        sequence: [],
        timestamp: Date.now(),
        locale: locale || 'default'
      })
      cardCache.value = newCache
      return []
    }

    // Prevent concurrent loads of the same data
    if (isLoadingSequence.value) {
      console.log('[SequenceStore] Already loading sequence, waiting...')
      // Wait for the current load to complete
      let waitCount = 0
      while (isLoadingSequence.value && waitCount < 100) {
        await new Promise(resolve => setTimeout(resolve, 50))
        waitCount++
      }

      // Check cache again after waiting
      if (cache.has(cacheKey)) {
        const entry = cache.get(cacheKey)!
        if (isCacheValid(entry, locale || 'default')) {
          return entry.sequence
        }
      }
    }

    isLoadingSequence.value = true

    try {
      let sequence: CardTile[] = []

      // Try to load from API first
      try {
        console.log(`[SequenceStore] Loading sequence from API for ${cacheKey}`)
        sequence = await sequenceService.loadSequence(parentId, locale)

        // Store in offline storage for future use
        await offlineStorageService.storeSequence(userId, sequence, parentId, locale)

      } catch (error) {
        console.warn('[SequenceStore] Failed to load from API, trying offline storage:', error)

        // Try to load from offline storage
        const offlineSequence = await offlineStorageService.getSequence(userId, parentId, locale)
        if (offlineSequence) {
          console.log(`[SequenceStore] Loaded ${offlineSequence.length} sequence from offline storage`)
          sequence = offlineSequence
        } else {
          throw new Error('No offline data available')
        }
      }

      // Update memory cache
      const newCache = new Map(cache)
      newCache.set(cacheKey, {
        parentId,
        sequence,
        timestamp: Date.now(),
        locale: locale || 'default'
      })
      cardCache.value = newCache

      console.log(`[SequenceStore] Cached ${sequence.length} sequence for ${cacheKey}`)
      return sequence
    } finally {
      isLoadingSequence.value = false
    }
  }

  const loadAllSequence = async (locale?: string): Promise<void> => {
    const userId = authStore.user?.id
    if (!userId) {
      console.warn('[SequenceStore] No user ID available')
      return
    }

    if (allSequenceLoaded.value && !locale) {
      console.log('[SequenceStore] All sequence already loaded')
      return
    }

    console.log('[SequenceStore] Loading all sequence in single API call...')
    isLoadingSequence.value = true

    try {
      // Load ALL sequence in a single API call
      const allSequence = await sequenceService.loadAllSequence()
      console.log(`[SequenceStore] Loaded ${allSequence.length} sequence in single call`)

      // Build cache structure from all sequence
      const sequenceByParent = new Map<string, CardTile[]>()

      // Group sequence by parent
      for (const card of allSequence) {
        const parentKey = card.parentId || 'root'
        if (!sequenceByParent.has(parentKey)) {
          sequenceByParent.set(parentKey, [])
        }
        sequenceByParent.get(parentKey)!.push(card)
      }

      // Sort sequence by index within each parent group
      for (const [parentKey, sequence] of sequenceByParent) {
        sequence.sort((a, b) => (a.index || 0) - (b.index || 0))
      }

      // Update cache with all data
      const newCache = new Map(cardCache.value)
      for (const [parentKey, sequence] of sequenceByParent) {
        const parentId = parentKey === 'root' ? undefined : parentKey
        const cacheKey = getCacheKey(parentId, locale)
        newCache.set(cacheKey, {
          parentId,
          sequence,
          timestamp: Date.now(),
          locale: locale || 'default'
        })
      }

      cardCache.value = newCache
      allSequenceLoaded.value = true

      // Store in offline storage for future use
      await offlineStorageService.storeSequence(userId, allSequence, undefined, locale)

      // Update sync metadata
      await offlineStorageService.updateSyncMetadata(userId, allSequence.length)

      console.log(`[SequenceStore] Cached all sequence. Total sequence: ${allSequence.length}, Total cache entries: ${cardCache.value.size}`)
    } finally {
      isLoadingSequence.value = false
    }
  }

  const clearCache = async () => {
    const userId = authStore.user?.id
    cardCache.value = new Map()
    allSequenceLoaded.value = false

    // Also clear offline storage if user is available
    if (userId) {
      await offlineStorageService.clearUserData(userId)
    }

    console.log('[SequenceStore] Card cache and offline storage cleared')
  }

  const clearCacheForLocale = async (locale: string) => {
    const cache = cardCache.value
    const newCache = new Map(cache)

    // Remove all entries for the specified locale
    for (const [key, entry] of cache) {
      if (entry.locale === locale) {
        newCache.delete(key)
      }
    }

    cardCache.value = newCache
    console.log(`[SequenceStore] Cleared cache for locale: ${locale}`)
  }

  const getSequenceForParent = (parentId?: string, locale?: string): CardTile[] | undefined => {
    const cacheKey = getCacheKey(parentId, locale)
    const entry = cardCache.value.get(cacheKey)

    if (entry && isCacheValid(entry, locale || 'default')) {
      return entry.sequence
    }

    return undefined
  }

  // Check offline data availability
  const checkOfflineStatus = async () => {
    const userId = authStore.user?.id
    if (!userId) return

    hasOfflineData.value = await offlineStorageService.hasOfflineData(userId)
  }

  // Sync offline data with server
  const syncOfflineData = async () => {
    const userId = authStore.user?.id
    if (!userId || !appStore.isOnline) return

    console.log('[SequenceStore] Starting offline data sync...')

    try {
      // Get current locale from i18n
      const { currentLocale } = useI18n()

      // Force refresh all data from server
      await loadAllSequence(currentLocale.value)

      const metadata = await offlineStorageService.getSyncMetadata(userId)
      if (metadata) {
        console.log(`[SequenceStore] Offline sync complete. Last sync: ${new Date(metadata.lastSync).toLocaleString()}`)
      }
    } catch (error) {
      console.error('[SequenceStore] Failed to sync offline data:', error)
    }
  }

  // Initialize offline support
  const initializeOfflineSupport = async () => {
    await checkOfflineStatus()

    // Sync data if online and has offline data
    if (appStore.isOnline && hasOfflineData.value) {
      await syncOfflineData()
    }
  }

  // Update a single card in all caches
  const updateCardInCache = async (updatedCard: CardTile, parentId?: string, locale?: string) => {
    const userId = authStore.user?.id
    if (!userId) return

    const cacheKey = getCacheKey(parentId, locale)
    const cache = cardCache.value

    // Update memory cache
    if (cache.has(cacheKey)) {
      const entry = cache.get(cacheKey)!
      const cardIndex = entry.sequence.findIndex(c => c.id === updatedCard.id)

      if (cardIndex >= 0) {
        // Update the card in the array
        const newSequence = [...entry.sequence]
        newSequence[cardIndex] = updatedCard

        // Update cache entry
        const newCache = new Map(cache)
        newCache.set(cacheKey, {
          ...entry,
          sequence: newSequence,
          timestamp: Date.now()
        })
        cardCache.value = newCache

        console.log(`[SequenceStore] Updated card ${updatedCard.id} in memory cache`)
      }
    }

    // Update offline storage
    const offlineSequence = await offlineStorageService.getSequence(userId, parentId, locale)
    if (offlineSequence) {
      const cardIndex = offlineSequence.findIndex(c => c.id === updatedCard.id)
      if (cardIndex >= 0) {
        offlineSequence[cardIndex] = updatedCard
        await offlineStorageService.storeSequence(userId, offlineSequence, parentId, locale)
        console.log(`[SequenceStore] Updated card ${updatedCard.id} in offline storage`)
      }
    }
  }

  // Add a new card to caches
  const addCardToCache = async (newCard: CardTile, parentId?: string, locale?: string) => {
    const userId = authStore.user?.id
    if (!userId) return

    const cacheKey = getCacheKey(parentId, locale)
    const cache = cardCache.value

    // Update memory cache
    if (cache.has(cacheKey)) {
      const entry = cache.get(cacheKey)!
      const newSequence = [...entry.sequence, newCard]

      // Update cache entry
      const newCache = new Map(cache)
      newCache.set(cacheKey, {
        ...entry,
        sequence: newSequence,
        timestamp: Date.now()
      })
      cardCache.value = newCache

      console.log(`[SequenceStore] Added card ${newCard.id} to memory cache`)
    }

    // Update offline storage
    const offlineSequence = await offlineStorageService.getSequence(userId, parentId, locale)
    if (offlineSequence) {
      offlineSequence.push(newCard)
      await offlineStorageService.storeSequence(userId, offlineSequence, parentId, locale)
      console.log(`[SequenceStore] Added card ${newCard.id} to offline storage`)
    }
  }

  // Replace entire cache for a parent (useful for bulk updates)
  const replaceCacheForParent = async (sequence: CardTile[], parentId?: string, locale?: string) => {
    const userId = authStore.user?.id
    if (!userId) return

    const cacheKey = getCacheKey(parentId, locale)
    
    // Update memory cache
    const newCache = new Map(cardCache.value)
    newCache.set(cacheKey, {
      parentId,
      sequence,
      timestamp: Date.now(),
      locale: locale || 'default'
    })
    cardCache.value = newCache

    // Update offline storage
    await offlineStorageService.storeSequence(userId, sequence, parentId, locale)
    
    console.log(`[SequenceStore] Replaced cache for parent ${parentId} with ${sequence.length} items`)
  }

  // Remove a card from caches
  const removeCardFromCache = async (cardId: string, parentId?: string, locale?: string) => {
    const userId = authStore.user?.id
    if (!userId) return

    const cacheKey = getCacheKey(parentId, locale)
    const cache = cardCache.value

    // Update memory cache
    if (cache.has(cacheKey)) {
      const entry = cache.get(cacheKey)!
      const newSequence = entry.sequence.filter(c => c.id !== cardId)

      // Update cache entry
      const newCache = new Map(cache)
      newCache.set(cacheKey, {
        ...entry,
        sequence: newSequence,
        timestamp: Date.now()
      })
      cardCache.value = newCache

      console.log(`[SequenceStore] Removed card ${cardId} from memory cache`)
    }

    // Update offline storage
    const offlineSequence = await offlineStorageService.getSequence(userId, parentId, locale)
    if (offlineSequence) {
      const filteredSequence = offlineSequence.filter(c => c.id !== cardId)
      await offlineStorageService.storeSequence(userId, filteredSequence, parentId, locale)
      console.log(`[SequenceStore] Removed card ${cardId} from offline storage`)
    }
  }

  // Game Logic Functions  
  const startPlay = async (sequenceId: string) => {
    try {
      // Get current locale
      const { currentLocale } = useI18n()
      
      // Load the items that belong to this sequence (children)
      console.log(`[SequenceStore] Loading sequence items for ${sequenceId} with locale ${currentLocale.value}`)
      const sequence = await loadSequence(sequenceId, currentLocale.value)
      console.log(`[SequenceStore] Starting play for sequence ${sequenceId}, found ${sequence.length} items:`, sequence.map(item => ({ 
        id: item.id, 
        title: item.title, 
        type: item.type,
        parentId: item.parentId 
      })))
      
      if (!sequence || sequence.length === 0) {
        console.warn(`[SequenceStore] No items found for sequence ${sequenceId}`)
        return
      }

      // Sort by index to get correct order (index is the orderIndex from the form)
      const sortedItems = [...sequence].sort((a, b) => (a.index || 0) - (b.index || 0))
      console.log(`[SequenceStore] Sorted items by correct order:`, sortedItems.map(item => ({ id: item.id, title: item.title, index: item.index })))
      
      // Create a shuffled copy for visual display
      let shuffled = [...sortedItems]
      let isInOriginalOrder = true
      let attempts = 0
      const maxAttempts = 10
      
      // Keep shuffling until we get a different order (or max attempts reached)
      while (isInOriginalOrder && attempts < maxAttempts) {
        // Fisher-Yates shuffle
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        
        // Check if the order is different from the original
        isInOriginalOrder = shuffled.every((item, index) => item.id === sortedItems[index].id)
        attempts++
        
        if (isInOriginalOrder && attempts < maxAttempts) {
          console.log(`[SequenceStore] Shuffle attempt ${attempts} resulted in original order, reshuffling...`)
        }
      }
      
      // If we couldn't get a different order (e.g., only 1 or 2 items), force a swap
      if (isInOriginalOrder && shuffled.length >= 2) {
        // Swap first two items to ensure different order
        [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]]
        console.log(`[SequenceStore] Forced swap to ensure different order`)
      }
      
      console.log(`[SequenceStore] After shuffle (visual order):`, shuffled.map((item, visualPos) => ({ 
        arrayPosition: visualPos,
        id: item.id, 
        title: item.title, 
        originalIndex: item.index
      })))
      
      playState.value = {
        currentSequenceId: sequenceId,
        shuffledItems: shuffled,
        selectedItems: [],
        correctOrder: sortedItems.map(item => item.id),
        isPlaying: true,
        isComplete: false
      }
      
      console.log(`[SequenceStore] Play state set:`, {
        currentSequenceId: playState.value.currentSequenceId,
        shuffledItemsCount: playState.value.shuffledItems.length,
        isPlaying: playState.value.isPlaying
      })
    } catch (error) {
      console.error(`[SequenceStore] Error starting play:`, error)
    }
  }

  const selectItem = async (itemId: string): Promise<boolean> => {
    if (!playState.value.isPlaying) return false
    
    const item = playState.value.shuffledItems.find(i => i.id === itemId)
    if (!item) return false
    
    // Check if item is already selected
    if (playState.value.selectedItems.some(i => i.id === itemId)) {
      return false
    }
    
    // Check if this is the correct next item in the sequence
    // correctOrder contains item IDs in the order they should be selected
    const nextIndex = playState.value.selectedItems.length
    const expectedItemId = playState.value.correctOrder[nextIndex]
    const isCorrect = expectedItemId === itemId
    
    console.log(`[SequenceStore] Item clicked:`, {
      clickedId: itemId,
      clickedTitle: item.title,
      clickedOrderIndex: item.index,
      expectedId: expectedItemId,
      nextPosition: nextIndex + 1,
      isCorrect
    })
    
    if (isCorrect) {
      // Add to selected items
      playState.value.selectedItems.push(item)
      
      // Play TTS if enabled
      if (settings.value.autoSpeak && item.speak) {
        await speakText(item.speak)
      }
      
      // Check if sequence is complete
      if (playState.value.selectedItems.length === playState.value.correctOrder.length) {
        playState.value.isComplete = true
        playState.value.isPlaying = false
      }
      
      return true
    }
    
    return false
  }

  const resetPlay = () => {
    playState.value = {
      currentSequenceId: null,
      shuffledItems: [],
      selectedItems: [],
      correctOrder: [],
      isPlaying: false,
      isComplete: false
    }
  }

  const restartPlay = () => {
    if (!playState.value.currentSequenceId) return
    
    // Get all items in their correct order first
    const itemsInCorrectOrder = [...playState.value.correctOrder].map(id => 
      playState.value.shuffledItems.find(item => item.id === id)!
    )
    
    // Create a new shuffled array for visual display
    let shuffled = [...itemsInCorrectOrder]
    let isInOriginalOrder = true
    let attempts = 0
    const maxAttempts = 10
    
    // Keep shuffling until we get a different order
    while (isInOriginalOrder && attempts < maxAttempts) {
      // Fisher-Yates shuffle
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      
      // Check if the order is different from the original
      isInOriginalOrder = shuffled.every((item, index) => item.id === itemsInCorrectOrder[index].id)
      attempts++
    }
    
    // If we couldn't get a different order, force a swap
    if (isInOriginalOrder && shuffled.length >= 2) {
      [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]]
    }
    
    console.log(`[SequenceStore] Restart - new visual order:`, shuffled.map((item, idx) => ({ 
      position: idx, 
      id: item.id, 
      title: item.title,
      correctOrder: item.index 
    })))
    
    playState.value = {
      ...playState.value,
      shuffledItems: shuffled,
      selectedItems: [],
      isPlaying: true,
      isComplete: false
    }
  }

  return {
    // Getters
    settings,
    cardCache: computed(() => cardCache.value),
    allSequenceLoaded: computed(() => allSequenceLoaded.value),
    isLoadingSequence: computed(() => isLoadingSequence.value),
    hasOfflineData: computed(() => hasOfflineData.value),
    currentPlayState,
    isItemNext,

    // Actions
    speakText,
    updateSettings,
    saveState,
    loadState,
    loadSequence,
    loadAllSequence,
    clearCache,
    clearCacheForLocale,
    getSequenceForParent,
    checkOfflineStatus,
    syncOfflineData,
    initializeOfflineSupport,
    updateCardInCache,
    addCardToCache,
    replaceCacheForParent,
    removeCardFromCache,
    
    // Game actions
    startPlay,
    selectItem,
    resetPlay,
    restartPlay,
   }
})
