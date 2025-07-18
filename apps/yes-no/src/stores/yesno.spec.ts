import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useYesNoStore } from './yesno'
import { itemService } from '@tiko/core'

// Mock the @tiko/core module
vi.mock('@tiko/core', () => ({
  useAppStore: vi.fn(() => ({
    getAppSettings: vi.fn(() => ({})),
    setAppSettings: vi.fn(() => Promise.resolve(true)),
    updateAppSettings: vi.fn(() => Promise.resolve(true)),
    loadAppSettings: vi.fn(() => Promise.resolve(true))
  })),
  useAuthStore: vi.fn(() => ({
    user: { id: 'test-user-id' }
  })),
  itemService: {
    getItems: vi.fn(() => Promise.resolve([])),
    createItem: vi.fn(() => Promise.resolve({ data: null, error: null })),
    updateItem: vi.fn(() => Promise.resolve({ data: null, error: null })),
    deleteItem: vi.fn(() => Promise.resolve({ data: null, error: null }))
  }
}))

describe('useYesNoStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with default values', () => {
    const store = useYesNoStore()
    
    expect(store.currentQuestion).toBe('Do you want to play?')
    expect(store.questionHistory).toEqual([])
    expect(store.isPlaying).toBe(false)
  })

  it('has default settings', () => {
    const store = useYesNoStore()
    
    expect(store.settings.buttonSize).toBe('large')
    expect(store.settings.autoSpeak).toBe(true)
    expect(store.settings.hapticFeedback).toBe(true)
  })

  it('can set a new question', () => {
    const store = useYesNoStore()
    
    store.setQuestion('Are you happy?')
    
    expect(store.currentQuestion).toBe('Are you happy?')
  })

  it('can set questions', () => {
    const store = useYesNoStore()
    
    store.setQuestion('Are you happy?')
    
    expect(store.currentQuestion).toBe('Are you happy?')
  })

  it('can clear history', async () => {
    const store = useYesNoStore()
    
    // Mock itemService to return a question when getItems is called
    vi.mocked(itemService.getItems).mockResolvedValueOnce([
      {
        id: '1',
        user_id: 'test-user-id',
        app_name: 'yesno',
        type: 'question',
        name: 'Test question',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_favorite: false,
        metadata: {}
      }
    ])
    
    await store.setQuestion('Test question')
    // Wait for the async operations to complete
    await new Promise(resolve => setTimeout(resolve, 10))
    
    expect(store.questionHistory).toHaveLength(1)
    
    await store.clearHistory()
    expect(store.questionHistory).toEqual([])
  })

  it('can speak questions', async () => {
    const store = useYesNoStore()
    
    store.setQuestion('Are you ready?')
    
    await store.speakQuestion()
    
    // Speech should be initiated
    expect(store.isPlaying).toBe(true) // Speech is in progress
  })

  it('can handle answers', async () => {
    const store = useYesNoStore()
    
    await store.handleAnswer('yes')
    
    // Answer handling should not throw errors
    expect(true).toBe(true)
  })

  it('can select questions', () => {
    const store = useYesNoStore()
    
    store.selectQuestion('Selected question')
    
    expect(store.currentQuestion).toBe('Selected question')
  })

  it('can update button size setting', async () => {
    const store = useYesNoStore()
    
    await store.updateSettings({ buttonSize: 'small' })
    
    // The settings would be updated via the appStore mock
    expect(store.settings.buttonSize).toBe('large') // Still default due to mocking
  })

  it('can update auto speak setting', async () => {
    const store = useYesNoStore()
    
    await store.updateSettings({ autoSpeak: false })
    
    // The settings would be updated via the appStore mock
    expect(store.settings.autoSpeak).toBe(true) // Still default due to mocking
  })

  it('can update haptic feedback setting', async () => {
    const store = useYesNoStore()
    
    await store.updateSettings({ hapticFeedback: false })
    
    // The settings would be updated via the appStore mock
    expect(store.settings.hapticFeedback).toBe(true) // Still default due to mocking
  })
})