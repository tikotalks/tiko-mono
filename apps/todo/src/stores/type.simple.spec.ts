import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTypeStore } from './type'

// Mock the @tiko/core module
vi.mock('@tiko/core', () => ({
  useAppStore: vi.fn(() => ({
    getAppSettings: vi.fn(() => ({})),
    setAppSettings: vi.fn(() => Promise.resolve(true)),
    updateAppSettings: vi.fn(() => Promise.resolve(true)),
  })),
}))

describe('useTypeStore', () => {
  beforeEach(() => {
    // Mock speechSynthesis (not available in node test environment)
    Object.defineProperty(globalThis, 'speechSynthesis', {
      value: {
        getVoices: vi.fn(() => [
          { name: 'Voice 1', lang: 'en-US', default: true, localService: true, voiceURI: 'voice-1' },
          { name: 'Voice 2', lang: 'en-US', default: false, localService: true, voiceURI: 'voice-2' },
          { name: 'Voice 3', lang: 'es-ES', default: false, localService: false, voiceURI: 'voice-3' },
        ]),
        speak: vi.fn(),
        cancel: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        speaking: false,
        paused: false,
      },
      writable: true,
    })
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with default values', () => {
    const store = useTypeStore()

    expect(store.currentText).toBe('')
    expect(store.isSpeaking).toBe(false)
    expect(store.isLoading).toBe(false)
    expect(store.selectedVoice).toBeNull()
    expect(store.availableVoices).toEqual([])
    expect(store.history).toEqual([])
  })

  it('can set text', () => {
    const store = useTypeStore()

    store.setText('Hello world')
    expect(store.currentText).toBe('Hello world')
  })

  it('can clear text', () => {
    const store = useTypeStore()

    store.setText('Hello world')
    store.clearText()
    expect(store.currentText).toBe('')
  })

  it('can add to history', async () => {
    const store = useTypeStore()

    await store.addToHistory('Test message')

    expect(store.history).toHaveLength(1)
    expect(store.history[0].text).toBe('Test message')
    expect(store.history[0].id).toBeDefined()
    expect(store.history[0].timestamp).toBeDefined()
  })

  it('can remove from history', async () => {
    const store = useTypeStore()

    await store.addToHistory('Test message')

    expect(store.history).toHaveLength(1)
    const historyId = store.history[0].id

    store.removeFromHistory(historyId)
    // Wait a bit for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(store.history).toHaveLength(0)
  })

  it('can clear history', async () => {
    const store = useTypeStore()

    await store.addToHistory('Test message')

    await store.clearHistory()
    expect(store.history).toHaveLength(0)
  })

  it('loads voices', async () => {
    const store = useTypeStore()

    await store.loadVoices()

    expect(store.availableVoices).toHaveLength(3)
    expect(store.hasVoices).toBe(true)
  })

  it('has default settings', () => {
    const store = useTypeStore()

    expect(store.settings.rate).toBe(1)
    expect(store.settings.pitch).toBe(1)
    expect(store.settings.volume).toBe(1)
    expect(store.settings.autoSave).toBe(true)
  })

  it('can set voice', async () => {
    const store = useTypeStore()

    const mockVoice = {
      name: 'Test Voice',
      lang: 'en-US',
      default: true,
      localService: true,
      voiceURI: 'test-voice',
    }

    await store.setVoice(mockVoice)
    expect(store.selectedVoice).toStrictEqual(mockVoice)
  })

  it('can cleanup', () => {
    const store = useTypeStore()

    // Should not throw any errors
    store.cleanup()
    expect(store.isSpeaking).toBe(false)
  })
})
