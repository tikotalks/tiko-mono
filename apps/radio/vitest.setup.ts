import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Set up Supabase environment variables for testing
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'

// Mock navigator object
global.navigator = {
  ...global.navigator,
  onLine: true,
  vibrate: vi.fn()
}

// Mock window location
global.window = {
  ...global.window,
  location: {
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: ''
  }
}

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