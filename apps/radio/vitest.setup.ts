import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Set up Tiko API environment variables for testing
process.env.VITE_ITEMS_API_URL = 'https://items.test.tikoapi.org'
process.env.VITE_MEDIA_API_URL = 'https://media.test.tikoapi.org'
process.env.VITE_CONTENT_API_URL = 'https://content.test.tikoapi.org'

// Mock navigator object
global.navigator = {
  ...global.navigator,
  onLine: true,
  vibrate: vi.fn(),
}

// Mock window location
global.window = {
  ...global.window,
  location: {
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
  },
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
}
global.localStorage = localStorageMock

// Configure Vue Test Utils
config.global.stubs = {
  transition: false,
  'transition-group': false,
}
