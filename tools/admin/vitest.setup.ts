import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Set up Supabase environment variables for testing
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'test-anon-key'

// Mock navigator object with vibrate support
global.navigator = {
  ...global.navigator,
  onLine: true,
  vibrate: vi.fn(() => true)
}

// Mock Speech Synthesis API
const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => []),
  speaking: false,
  paused: false,
  pending: false
}

// Mock SpeechSynthesisUtterance
class MockSpeechSynthesisUtterance {
  text = ''
  voice = null
  rate = 1
  pitch = 1
  volume = 1
  onend = null
  onerror = null

  constructor(text) {
    this.text = text
  }
}

global.window = {
  ...global.window,
  speechSynthesis: mockSpeechSynthesis,
  SpeechSynthesisUtterance: MockSpeechSynthesisUtterance,
  location: {
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: ''
  }
}

// Make speechSynthesis available globally
global.speechSynthesis = mockSpeechSynthesis
global.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn()
}
global.localStorage = localStorageMock

// Configure Vue Test Utils
config.global.stubs = {
  transition: false,
  'transition-group': false
}
