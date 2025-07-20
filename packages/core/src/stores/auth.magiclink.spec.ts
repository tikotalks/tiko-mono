import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock auth service before importing the store
vi.mock('../services', () => ({
  authService: {
    handleMagicLinkCallback: vi.fn(),
    getSession: vi.fn(),
    updateUserMetadata: vi.fn()
  }
}))

import { useAuthStore } from './auth'
import { authService } from '../services'

// Get the mocked service
const mockAuthService = authService as any

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

describe('AuthStore - Magic Link Flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should handle magic link callback successfully', async () => {
    const authStore = useAuthStore()
    
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {
        settings: {
          theme: 'dark',
          language: 'nl-NL'
        }
      }
    }
    
    const mockSession = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_at: Date.now() / 1000 + 3600,
      expires_in: 3600,
      token_type: 'bearer',
      user: mockUser
    }

    mockAuthService.handleMagicLinkCallback.mockResolvedValue({
      success: true,
      user: mockUser,
      session: mockSession
    })

    const result = await authStore.handleMagicLinkCallback()

    expect(result.success).toBe(true)
    expect(authStore.user).toEqual(mockUser)
    expect(authStore.session).toEqual(mockSession)
    expect(authStore.isAuthenticated).toBe(true)
  })

  it('should load user settings from magic link response', async () => {
    const authStore = useAuthStore()
    
    // Set some existing settings in localStorage
    authStore.userSettings = { theme: 'light', language: 'en-GB' }
    
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {
        settings: {
          theme: 'dark',
          language: 'nl-NL',
          customSetting: 'value'
        }
      }
    }

    mockAuthService.handleMagicLinkCallback.mockResolvedValue({
      success: true,
      user: mockUser,
      session: { user: mockUser }
    })

    await authStore.handleMagicLinkCallback()

    // localStorage settings should take precedence
    expect(authStore.userSettings.theme).toBe('light')
    expect(authStore.userSettings.language).toBe('en-GB')
    // But new settings from API should be added
    expect(authStore.userSettings.customSetting).toBe('value')
    
    // Should save merged settings
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'tiko-user-settings',
      expect.stringContaining('light')
    )
  })

  it('should handle magic link callback failure', async () => {
    const authStore = useAuthStore()
    
    mockAuthService.handleMagicLinkCallback.mockResolvedValue({
      success: false,
      error: 'Invalid token'
    })

    const result = await authStore.handleMagicLinkCallback()

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid token')
    expect(authStore.user).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
  })

  it('should handle missing user metadata gracefully', async () => {
    const authStore = useAuthStore()
    
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {
        settings: null // No settings
      }
    }

    mockAuthService.handleMagicLinkCallback.mockResolvedValue({
      success: true,
      user: mockUser,
      session: { user: mockUser }
    })

    const result = await authStore.handleMagicLinkCallback()

    // Should still succeed
    expect(result.success).toBe(true)
    expect(authStore.user).toEqual(mockUser)
    
    // Settings should remain unchanged when null
    expect(authStore.userSettings).toEqual({})
  })

  it('should handle service exception', async () => {
    const authStore = useAuthStore()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    mockAuthService.handleMagicLinkCallback.mockRejectedValue(new Error('Network error'))

    const result = await authStore.handleMagicLinkCallback()

    expect(result.success).toBe(false)
    expect(result.error).toBe('Failed to process magic link')
    expect(consoleSpy).toHaveBeenCalledWith(
      '[Auth Store] Error handling magic link:',
      expect.any(Error)
    )

    consoleSpy.mockRestore()
  })

  it('should not override existing localStorage settings', async () => {
    const authStore = useAuthStore()
    
    // Simulate existing settings in localStorage
    authStore.userSettings = {
      theme: 'auto',
      language: 'fr-FR',
      voice: 'Marie'
    }

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {
        settings: {
          theme: 'dark',
          language: 'en-US',
          voice: 'Alex'
        }
      }
    }

    mockAuthService.handleMagicLinkCallback.mockResolvedValue({
      success: true,
      user: mockUser,
      session: { user: mockUser }
    })

    await authStore.handleMagicLinkCallback()

    // All localStorage values should be preserved
    expect(authStore.userSettings).toEqual({
      theme: 'auto',
      language: 'fr-FR',
      voice: 'Marie'
    })
  })

  it('should handle user without metadata', async () => {
    const authStore = useAuthStore()
    
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com'
      // No user_metadata
    }

    mockAuthService.handleMagicLinkCallback.mockResolvedValue({
      success: true,
      user: mockUser,
      session: { user: mockUser }
    })

    const result = await authStore.handleMagicLinkCallback()

    expect(result.success).toBe(true)
    expect(authStore.user).toEqual(mockUser)
    // Settings should remain unchanged
    expect(authStore.userSettings).toEqual({})
  })
})