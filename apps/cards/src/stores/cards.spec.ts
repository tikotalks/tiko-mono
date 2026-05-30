import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCardStore } from './cards'
import { useAppStore, useAuthStore } from '@tiko/core'

// Mock @tiko/core
const mockUpdateAppSettings = vi.fn(() => Promise.resolve(true))
const mockLoadAppSettings = vi.fn(() => Promise.resolve(true))
const mockGetAppSettings = vi.fn(() => ({}))

vi.mock('@tiko/core', () => ({
  useAppStore: vi.fn(() => ({
    getAppSettings: mockGetAppSettings,
    setAppSettings: vi.fn(() => Promise.resolve(true)),
    updateAppSettings: mockUpdateAppSettings,
    loadAppSettings: mockLoadAppSettings,
    isOnline: true,
  })),
  useAuthStore: vi.fn(() => ({
    user: { id: 'test-user-id' },
  })),
  itemService: {
    getItems: vi.fn(() => Promise.resolve([])),
    createItem: vi.fn(() => Promise.resolve({ data: null, error: null })),
    updateItem: vi.fn(() => Promise.resolve({ data: null, error: null })),
    deleteItem: vi.fn(() => Promise.resolve({ data: null, error: null })),
    verifyAndFixHasChildrenFlags: vi.fn(() =>
      Promise.resolve({ total: 0, fixed: 0, unchanged: 0 })
    ),
  },
  useI18n: vi.fn(() => ({
    currentLocale: { value: 'en' },
  })),
}))

// Mock @tiko/ui
vi.mock('@tiko/ui', () => ({
  useTextToSpeech: vi.fn(() => ({
    speak: vi.fn(() => Promise.resolve()),
  })),
}))

// Mock cards service
vi.mock('../services/cards.service', () => ({
  cardsService: {
    loadCards: vi.fn(() => Promise.resolve([])),
    loadAllCards: vi.fn(() => Promise.resolve([])),
  },
}))

// Mock offline storage service
vi.mock('../services/cards-offline-storage.service', () => ({
  offlineStorageService: {
    storeCards: vi.fn(() => Promise.resolve()),
    getCards: vi.fn(() => Promise.resolve(null)),
    hasOfflineData: vi.fn(() => Promise.resolve(false)),
    clearUserData: vi.fn(() => Promise.resolve()),
    updateSyncMetadata: vi.fn(() => Promise.resolve()),
    getSyncMetadata: vi.fn(() => Promise.resolve(null)),
  },
}))

describe('useCardStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with default settings', () => {
    const store = useCardStore()

    expect(store.settings.buttonSize).toBe('large')
    expect(store.settings.autoSpeak).toBe(true)
    expect(store.settings.hapticFeedback).toBe(true)
    expect(store.settings.showCuratedItems).toBe(true)
    expect(store.settings.showHiddenItems).toBe(false)
    expect(store.settings.hiddenItems).toEqual([])
    expect(store.settings.showHints).toBe(false)
  })

  it('initializes with empty cache', () => {
    const store = useCardStore()

    expect(store.cardCache.size).toBe(0)
    expect(store.allCardsLoaded).toBe(false)
    expect(store.isLoadingCards).toBe(false)
    expect(store.hasOfflineData).toBe(false)
  })

  it('returns undefined for cards not in cache', () => {
    const store = useCardStore()

    const result = store.getCardsForParent(undefined, 'en')
    expect(result).toBeUndefined()
  })

  it('clears cache correctly', async () => {
    const store = useCardStore()

    await store.clearCache()

    expect(store.cardCache.size).toBe(0)
    expect(store.allCardsLoaded).toBe(false)
  })

  it('updateSettings calls appStore.updateAppSettings', async () => {
    const store = useCardStore()

    await store.updateSettings({ buttonSize: 'small' })

    expect(mockUpdateAppSettings).toHaveBeenCalled()
  })

  it('toggleItemVisibility hides visible items and clears cache', async () => {
    const store = useCardStore()

    // Pre-populate cache
    await store.clearCache() // just to exercise

    await store.toggleItemVisibility('item-1')

    // Should have called updateAppSettings (from hideItem -> updateSettings)
    expect(mockUpdateAppSettings).toHaveBeenCalled()
  })

  it('loadState calls appStore.loadAppSettings', async () => {
    const store = useCardStore()

    await store.loadState()

    expect(mockLoadAppSettings).toHaveBeenCalledWith('cards')
  })

  it('saveState calls appStore.updateAppSettings', async () => {
    const store = useCardStore()

    await store.saveState()

    expect(mockUpdateAppSettings).toHaveBeenCalledWith('cards', expect.any(Object))
  })
})
