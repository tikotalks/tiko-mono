import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Mock window object properly for fake timers
global.window = global.window || {}

// Don't mock setInterval/clearInterval - let fake timers handle them
// global.window.setInterval = vi.fn()
// global.window.clearInterval = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
}
global.localStorage = localStorageMock

// Mock navigator
global.navigator = {
  ...global.navigator,
  vibrate: vi.fn(),
}

// Mock Audio
global.Audio = vi.fn().mockImplementation(() => ({
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  load: vi.fn(),
}))

// Configure Vue Test Utils
config.global.stubs = {
  transition: false,
  'transition-group': false,
}
