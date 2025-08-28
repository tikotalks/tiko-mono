import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { useAppStore, useAuthStore, itemService } from '@tiko/core'
import { cardsService } from '../services/cards.service'
import { offlineStorageService } from '../services/cards-offline-storage.service'
import type { TCardTile as CardTile } from '@tiko/ui'
import { useI18n } from '@tiko/core'

export interface YesNoSettings {
  buttonSize: 'small' | 'medium' | 'large'
  autoSpeak: boolean
  hapticFeedback: boolean
  showCuratedItems: boolean
  showHiddenItems: boolean // Show hidden items with opacity
  hiddenItems: string[] // Array of item IDs that user has hidden
  showHints: boolean
}

interface CardCacheEntry {
  parentId?: string
  cards: CardTile[]
  timestamp: number
  locale: string
}

export const useCardStore = defineStore('cards', () => {
  const appStore = useAppStore()
  const authStore = useAuthStore()
  
  // Card cache - using shallowRef for better performance with large arrays
  const cardCache = shallowRef(new Map<string, CardCacheEntry>())
  const allCardsLoaded = ref(false)
  const isLoadingCards = ref(false)
  const hasOfflineData = ref(false)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes


  // Settings with defaults
  const defaultSettings: YesNoSettings = {
    buttonSize: 'large',
    autoSpeak: true,
    hapticFeedback: true,
    showCuratedItems: true,
    showHiddenItems: false,
    hiddenItems: [],
    showHints: false
  }

  // Getters
  const settings = computed((): YesNoSettings => {
    const appSettings = appStore.getAppSettings('yes-no')
    return { ...defaultSettings, ...appSettings }
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

  const updateSettings = async (newSettings: Partial<YesNoSettings>) => {
    const currentSettings = settings.value
    const updatedSettings = { ...currentSettings, ...newSettings }

    await appStore.updateAppSettings('yes-no', updatedSettings)
  }

  const saveState = async () => {
    await appStore.updateAppSettings('cards', {
      ...settings.value
    })
  }


  const loadState = async () => {
    console.log('[CardsStore] Loading state...')
    await appStore.loadAppSettings('yes-no')

    const appSettings = appStore.getAppSettings('yes-no')
    console.log('[CardsStore] Retrieved settings:', appSettings)

    if (appSettings?.currentQuestion) {
      console.log('[CardsStore] Loaded question:', appSettings.currentQuestion)
    } else {
      console.log('[CardsStore] No saved question found, using default')
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
  
  const loadCards = async (parentId?: string, locale?: string, forceRefresh = false): Promise<CardTile[]> => {
    const cacheKey = getCacheKey(parentId, locale)
    const cache = cardCache.value
    const userId = authStore.user?.id
    const isSkipAuth = sessionStorage.getItem('tiko_skip_auth') === 'true'
    
    if (!userId && !isSkipAuth) {
      console.warn('[CardsStore] No user ID available and not in skip auth mode')
      return []
    }
    
    // Check memory cache first
    if (!forceRefresh && cache.has(cacheKey)) {
      const entry = cache.get(cacheKey)!
      if (isCacheValid(entry, locale || 'default')) {
        console.log(`[CardsStore] Returning cached cards for ${cacheKey}`)
        // Only filter out hidden items for ROOT level, not for children
        if (!parentId) {
          const hiddenItems = settings.value.hiddenItems || []
          const showHidden = settings.value.showHiddenItems
          
          if (showHidden) {
            // Show all cards, but mark hidden ones
            return entry.cards.map(item => ({
              ...item,
              isHidden: hiddenItems.includes(item.id)
            }))
          } else {
            // Filter out hidden items completely
            const filteredCards = entry.cards.filter(item => !hiddenItems.includes(item.id))
            return filteredCards
          }
        } else {
          // For children, return all items (don't filter)
          return entry.cards
        }
      }
    }
    
    // If loadAllCards is in progress, wait for it to complete
    if (isLoadingCards.value && !forceRefresh) {
      console.log(`[CardsStore] Waiting for loadAllCards to complete for ${cacheKey}...`)
      // Wait for loadAllCards to complete with a reasonable timeout
      let waitCount = 0
      const maxWaitTime = 100 // 5 seconds max wait (100 * 50ms)
      while (isLoadingCards.value && waitCount < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 50))
        waitCount++
      }
      
      // After waiting, check cache again
      if (cache.has(cacheKey)) {
        const entry = cache.get(cacheKey)!
        if (isCacheValid(entry, locale || 'default')) {
          console.log(`[CardsStore] Found cached entry after waiting for ${cacheKey}`)
          // Apply same filtering logic as above
          if (!parentId) {
            const hiddenItems = settings.value.hiddenItems || []
            const showHidden = settings.value.showHiddenItems
            
            if (showHidden) {
              return entry.cards.map(item => ({
                ...item,
                isHidden: hiddenItems.includes(item.id)
              }))
            } else {
              const filteredCards = entry.cards.filter(item => !hiddenItems.includes(item.id))
              return filteredCards
            }
          } else {
            return entry.cards
          }
        }
      }
    }
    
    // If all cards are loaded, we should have the data in cache
    if (allCardsLoaded.value && !forceRefresh) {
      console.log(`[CardsStore] All cards loaded, but cache miss for ${cacheKey}. Returning empty array.`)
      // Cache the empty result to prevent future API calls
      const newCache = new Map(cache)
      newCache.set(cacheKey, {
        parentId,
        cards: [],
        timestamp: Date.now(),
        locale: locale || 'default'
      })
      cardCache.value = newCache
      return []
    }
    
    
    isLoadingCards.value = true
    
    try {
      let cards: CardTile[] = []
      
      // Try to load from API first
      try {
        console.log(`[CardsStore] Loading cards from API for ${cacheKey}`)
        const showCurated = settings.value.showCuratedItems
        cards = await cardsService.loadCards(parentId, showCurated, locale)
        
        // Store in offline storage for future use (only if we have a userId)
        if (userId) {
          await offlineStorageService.storeCards(userId, cards, parentId, locale)
        }
        
      } catch (error) {
        console.warn('[CardsStore] Failed to load from API, trying offline storage:', error)
        
        // Try to load from offline storage (only if we have a userId)
        if (userId) {
          const offlineCards = await offlineStorageService.getCards(userId, parentId, locale)
          if (offlineCards) {
            console.log(`[CardsStore] Loaded ${offlineCards.length} cards from offline storage`)
            cards = offlineCards
          } else {
            throw new Error('No offline data available')
          }
        } else {
          // Skip auth mode - no offline storage
          throw new Error('No offline data available in skip auth mode')
        }
      }
      
      // Update memory cache
      const newCache = new Map(cache)
      newCache.set(cacheKey, {
        parentId,
        cards,
        timestamp: Date.now(),
        locale: locale || 'default'
      })
      cardCache.value = newCache
      
      console.log(`[CardsStore] Cached ${cards.length} cards for ${cacheKey}`)
      
      // Only filter out hidden items for ROOT level, not for children
      if (!parentId) {
        const hiddenItems = settings.value.hiddenItems || []
        const showHidden = settings.value.showHiddenItems
        
        if (showHidden) {
          // Show all cards, but mark hidden ones
          const markedCards = cards.map(item => ({
            ...item,
            isHidden: hiddenItems.includes(item.id)
          }))
          
          const hiddenCount = markedCards.filter(item => item.isHidden).length
          if (hiddenCount > 0) {
            console.log(`[CardsStore] Showing ${hiddenCount} hidden items with opacity`)
          }
          
          return markedCards
        } else {
          // Filter out hidden items completely
          const filteredCards = cards.filter(item => !hiddenItems.includes(item.id))
          
          if (filteredCards.length !== cards.length) {
            console.log(`[CardsStore] Filtered out ${cards.length - filteredCards.length} hidden items`)
          }
          
          return filteredCards
        }
      } else {
        // For children, return all items (don't filter)
        return cards
      }
    } finally {
      isLoadingCards.value = false
    }
  }
  
  const loadAllCards = async (locale?: string): Promise<void> => {
    const userId = authStore.user?.id
    if (!userId) {
      console.warn('[CardsStore] No user ID available')
      return
    }
    
    if (allCardsLoaded.value && !locale) {
      console.log('[CardsStore] All cards already loaded')
      return
    }
    
    console.log('[CardsStore] Loading all cards in single API call...')
    isLoadingCards.value = true
    
    try {
      // Load ALL cards in a single API call, including curated items if enabled in settings
      const includeCurated = settings.value.showCuratedItems
      const allCards = await cardsService.loadAllCards(includeCurated)
      console.log(`[CardsStore] Loaded ${allCards.length} cards in single call (includeCurated: ${includeCurated})`)
      
      // Build cache structure from all cards
      const cardsByParent = new Map<string, CardTile[]>()
      
      // Debug: Check has_children flags
      const cardsWithHasChildren = allCards.filter(c => c.has_children === true)
      console.log(`[CardsStore] Cards with has_children=true: ${cardsWithHasChildren.length} out of ${allCards.length}`)
      
      // Group cards by parent
      for (const card of allCards) {
        const parentKey = card.parentId || 'root'
        if (!cardsByParent.has(parentKey)) {
          cardsByParent.set(parentKey, [])
        }
        cardsByParent.get(parentKey)!.push(card)
      }
      
      // Sort cards by index within each parent group
      for (const [parentKey, cards] of cardsByParent) {
        cards.sort((a, b) => (a.index || 0) - (b.index || 0))
      }
      
      // Update cache with all data
      const newCache = new Map(cardCache.value)
      
      // First, add all parent entries from cardsByParent
      for (const [parentKey, cards] of cardsByParent) {
        const parentId = parentKey === 'root' ? undefined : parentKey
        const cacheKey = getCacheKey(parentId, locale)
        newCache.set(cacheKey, {
          parentId,
          cards,
          timestamp: Date.now(),
          locale: locale || 'default'
        })
      }
      
      // Also create empty cache entries for all cards that could be parents (has_children = true)
      // This ensures cache lookups won't fail for cards that have no children yet
      let emptyEntriesCreated = 0
      for (const card of allCards) {
        if (card.has_children) {
          const cacheKey = getCacheKey(card.id, locale)
          if (!newCache.has(cacheKey)) {
            newCache.set(cacheKey, {
              parentId: card.id,
              cards: [],
              timestamp: Date.now(),
              locale: locale || 'default'
            })
            emptyEntriesCreated++
          }
        }
      }
      console.log(`[CardsStore] Created ${emptyEntriesCreated} empty cache entries for cards with has_children=true`)
      
      cardCache.value = newCache
      allCardsLoaded.value = true
      
      // Store in offline storage for future use
      await offlineStorageService.storeCards(userId, allCards, undefined, locale)
      
      // Update sync metadata
      await offlineStorageService.updateSyncMetadata(userId, allCards.length)
      
      console.log(`[CardsStore] Cached all cards. Total cards: ${allCards.length}, Total cache entries: ${cardCache.value.size}`)
    } finally {
      isLoadingCards.value = false
    }
  }
  
  const clearCache = async () => {
    const userId = authStore.user?.id
    cardCache.value = new Map()
    allCardsLoaded.value = false
    
    // Also clear offline storage if user is available
    if (userId) {
      await offlineStorageService.clearUserData(userId)
    }
    
    console.log('[CardsStore] Card cache and offline storage cleared')
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
    console.log(`[CardsStore] Cleared cache for locale: ${locale}`)
  }
  
  const getCardsForParent = (parentId?: string, locale?: string): CardTile[] | undefined => {
    const cacheKey = getCacheKey(parentId, locale)
    const entry = cardCache.value.get(cacheKey)
    
    if (entry && isCacheValid(entry, locale || 'default')) {
      // Only filter out hidden items for ROOT level, not for children
      if (!parentId) {
        const hiddenItems = settings.value.hiddenItems || []
        const showHidden = settings.value.showHiddenItems
        
        if (showHidden) {
          // Show all cards, but mark hidden ones
          return entry.cards.map(item => ({
            ...item,
            isHidden: hiddenItems.includes(item.id)
          }))
        } else {
          // Filter out hidden items completely
          const filteredCards = entry.cards.filter(item => !hiddenItems.includes(item.id))
          return filteredCards
        }
      } else {
        // For children, return all items (don't filter)
        return entry.cards
      }
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
    
    console.log('[CardsStore] Starting offline data sync...')
    
    try {
      // Get current locale from i18n
      const { currentLocale } = useI18n()
      
      // Force refresh all data from server
      await loadAllCards(currentLocale.value)
      
      const metadata = await offlineStorageService.getSyncMetadata(userId)
      if (metadata) {
        console.log(`[CardsStore] Offline sync complete. Last sync: ${new Date(metadata.lastSync).toLocaleString()}`)
      }
    } catch (error) {
      console.error('[CardsStore] Failed to sync offline data:', error)
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
      const cardIndex = entry.cards.findIndex(c => c.id === updatedCard.id)
      
      if (cardIndex >= 0) {
        // Update the card in the array
        const newCards = [...entry.cards]
        newCards[cardIndex] = updatedCard
        
        // Update cache entry
        const newCache = new Map(cache)
        newCache.set(cacheKey, {
          ...entry,
          cards: newCards,
          timestamp: Date.now()
        })
        cardCache.value = newCache
        
        console.log(`[CardsStore] Updated card ${updatedCard.id} in memory cache`)
      }
    }
    
    // Update offline storage
    const offlineCards = await offlineStorageService.getCards(userId, parentId, locale)
    if (offlineCards) {
      const cardIndex = offlineCards.findIndex(c => c.id === updatedCard.id)
      if (cardIndex >= 0) {
        offlineCards[cardIndex] = updatedCard
        await offlineStorageService.storeCards(userId, offlineCards, parentId, locale)
        console.log(`[CardsStore] Updated card ${updatedCard.id} in offline storage`)
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
      const newCards = [...entry.cards, newCard]
      
      // Update cache entry
      const newCache = new Map(cache)
      newCache.set(cacheKey, {
        ...entry,
        cards: newCards,
        timestamp: Date.now()
      })
      cardCache.value = newCache
      
      console.log(`[CardsStore] Added card ${newCard.id} to memory cache`)
    }
    
    // Update offline storage
    const offlineCards = await offlineStorageService.getCards(userId, parentId, locale)
    if (offlineCards) {
      offlineCards.push(newCard)
      await offlineStorageService.storeCards(userId, offlineCards, parentId, locale)
      console.log(`[CardsStore] Added card ${newCard.id} to offline storage`)
    }
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
      const newCards = entry.cards.filter(c => c.id !== cardId)
      
      // Update cache entry
      const newCache = new Map(cache)
      newCache.set(cacheKey, {
        ...entry,
        cards: newCards,
        timestamp: Date.now()
      })
      cardCache.value = newCache
      
      console.log(`[CardsStore] Removed card ${cardId} from memory cache`)
    }
    
    // Update offline storage
    const offlineCards = await offlineStorageService.getCards(userId, parentId, locale)
    if (offlineCards) {
      const filteredCards = offlineCards.filter(c => c.id !== cardId)
      await offlineStorageService.storeCards(userId, filteredCards, parentId, locale)
      console.log(`[CardsStore] Removed card ${cardId} from offline storage`)
    }
  }
  
  // Hide/show item functions
  const hideItem = async (itemId: string) => {
    const currentHidden = settings.value.hiddenItems || []
    if (!currentHidden.includes(itemId)) {
      await updateSettings({ 
        hiddenItems: [...currentHidden, itemId] 
      })
      console.log(`[CardsStore] Hid item: ${itemId}`)
      
      // Clear cache to trigger re-filtering
      await clearCache()
    }
  }
  
  const showItem = async (itemId: string) => {
    const currentHidden = settings.value.hiddenItems || []
    if (currentHidden.includes(itemId)) {
      await updateSettings({ 
        hiddenItems: currentHidden.filter(id => id !== itemId) 
      })
      console.log(`[CardsStore] Showed item: ${itemId}`)
      
      // Clear cache to trigger re-filtering
      await clearCache()
    }
  }
  
  const toggleItemVisibility = async (itemId: string) => {
    const currentHidden = settings.value.hiddenItems || []
    if (currentHidden.includes(itemId)) {
      await showItem(itemId)
    } else {
      await hideItem(itemId)
    }
  }
  
  const toggleShowHiddenItems = async () => {
    await updateSettings({ 
      showHiddenItems: !settings.value.showHiddenItems 
    })
    console.log(`[CardsStore] Toggled show hidden items: ${settings.value.showHiddenItems}`)
    
    // Clear cache to trigger re-filtering
    await clearCache()
  }
  
  // Verify and fix has_children flags for all user's cards
  const verifyHasChildrenFlags = async () => {
    const userId = authStore.user?.id
    if (!userId) {
      console.error('[CardsStore] No user ID available for verification')
      return null
    }
    
    console.log('[CardsStore] Starting has_children verification...')
    
    try {
      const result = await itemService.verifyAndFixHasChildrenFlags(userId, 'cards')
      console.log(`[CardsStore] Verification complete:`, result)
      
      // Clear cache to ensure fresh data
      if (result.fixed > 0) {
        console.log('[CardsStore] Clearing cache after fixing has_children flags')
        await clearCache()
      }
      
      return result
    } catch (error) {
      console.error('[CardsStore] Failed to verify has_children flags:', error)
      return null
    }
  }
  
  return {
    // Getters
    settings,
    cardCache: computed(() => cardCache.value),
    allCardsLoaded: computed(() => allCardsLoaded.value),
    isLoadingCards: computed(() => isLoadingCards.value),
    hasOfflineData: computed(() => hasOfflineData.value),
    
    // Actions
    speakText,
    updateSettings,
    saveState,
    loadState,
    loadCards,
    loadAllCards,
    clearCache,
    clearCacheForLocale,
    getCardsForParent,
    checkOfflineStatus,
    syncOfflineData,
    initializeOfflineSupport,
    updateCardInCache,
    addCardToCache,
    removeCardFromCache,
    
    // Hidden items functions
    hideItem,
    showItem,
    toggleItemVisibility,
    toggleShowHiddenItems,
    
    // Maintenance functions
    verifyHasChildrenFlags,
   }
})
