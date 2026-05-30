import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSequenceStore } from './sequence'

// Shared mock references
const mockUpdateAppSettings = vi.fn(() => Promise.resolve(true))
const mockLoadAppSettings = vi.fn(() => Promise.resolve(true))
const mockGetAppSettings = vi.fn(() => ({}))

vi.mock('@tiko/core', () => ({
  useAppStore: vi.fn(() => ({
    getAppSettings: mockGetAppSettings,
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
  },
  useI18nSimple: vi.fn(() => ({
    currentLocale: { value: 'en' },
  })),
  useSpeak: vi.fn(() => ({
    speak: vi.fn(() => Promise.resolve()),
    stop: vi.fn(),
  })),
}))

vi.mock('../services/sequence.service', () => ({
  sequenceService: {
    loadSequence: vi.fn(() => Promise.resolve([])),
    loadAllSequence: vi.fn(() => Promise.resolve([])),
  },
}))

vi.mock('../services/sequence-offline-storage.service', () => ({
  offlineStorageService: {
    storeSequence: vi.fn(() => Promise.resolve()),
    getSequence: vi.fn(() => Promise.resolve(null)),
    hasOfflineData: vi.fn(() => Promise.resolve(false)),
    clearUserData: vi.fn(() => Promise.resolve()),
    updateSyncMetadata: vi.fn(() => Promise.resolve()),
    getSyncMetadata: vi.fn(() => Promise.resolve(null)),
  },
}))

describe('useSequenceStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with default settings', () => {
    const store = useSequenceStore()

    expect(store.settings.autoSpeak).toBe(true)
    expect(store.settings.showHints).toBe(false)
    expect(store.settings.hapticFeedback).toBe(true)
    expect(store.settings.showCuratedItems).toBe(true)
    expect(store.settings.showHiddenItems).toBe(false)
    expect(store.settings.hiddenItems).toEqual([])
    expect(store.settings.enableAnimations).toBe(true)
    expect(store.settings.enableSounds).toBe(true)
    expect(store.settings.enableRewardAnimations).toBe(true)
  })

  it('initializes with empty cache', () => {
    const store = useSequenceStore()

    expect(store.cardCache.size).toBe(0)
    expect(store.allSequenceLoaded).toBe(false)
    expect(store.isLoadingSequence).toBe(false)
    expect(store.hasOfflineData).toBe(false)
  })

  it('initializes play state with defaults', () => {
    const store = useSequenceStore()
    const playState = store.currentPlayState

    expect(playState.currentSequenceId).toBeNull()
    expect(playState.shuffledItems).toEqual([])
    expect(playState.selectedItems).toEqual([])
    expect(playState.correctOrder).toEqual([])
    expect(playState.isPlaying).toBe(false)
    expect(playState.isComplete).toBe(false)
  })

  it('clears cache correctly', async () => {
    const store = useSequenceStore()

    await store.clearCache()

    expect(store.cardCache.size).toBe(0)
    expect(store.allSequenceLoaded).toBe(false)
  })

  it('loadState calls appStore.loadAppSettings', async () => {
    const store = useSequenceStore()

    await store.loadState()

    expect(mockLoadAppSettings).toHaveBeenCalledWith('sequence')
  })

  it('saveState calls appStore.updateAppSettings', async () => {
    const store = useSequenceStore()

    await store.saveState()

    expect(mockUpdateAppSettings).toHaveBeenCalledWith('sequence', expect.any(Object))
  })

  it('updateSettings calls appStore.updateAppSettings', async () => {
    const store = useSequenceStore()

    await store.updateSettings({ showHints: true })

    expect(mockUpdateAppSettings).toHaveBeenCalledWith('sequence', expect.objectContaining({
      showHints: true,
    }))
  })

  it('stopCurrentAudio does not throw', () => {
    const store = useSequenceStore()

    expect(() => store.stopCurrentAudio()).not.toThrow()
  })
})
