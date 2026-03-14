import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { mockAuthStore, mockUserSettingsService } = vi.hoisted(() => ({
  mockAuthStore: {
    user: null as { id: string } | null,
    session: null,
    isAuthenticated: false,
  },
  mockUserSettingsService: {
    saveSettings: vi.fn(),
    getSettings: vi.fn(),
    getAllUserSettings: vi.fn(),
  },
}))

vi.mock('./auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

vi.mock('../services', () => ({
  userSettingsService: mockUserSettingsService,
}))

import { useAppStore } from './app'

describe('useAppStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    mockAuthStore.user = null
    mockAuthStore.session = null
    mockAuthStore.isAuthenticated = false

    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    })

    mockUserSettingsService.saveSettings.mockResolvedValue({ success: true })
    mockUserSettingsService.getSettings.mockResolvedValue(null)
    mockUserSettingsService.getAllUserSettings.mockResolvedValue([])
  })

  it('stores app settings in local storage mode when no authenticated user exists', async () => {
    const appStore = useAppStore()
    const nextSettings = { keyboardLayout: 'alphabet', hapticFeedback: false }

    await appStore.updateAppSettings('type', nextSettings)

    expect(mockUserSettingsService.saveSettings).toHaveBeenCalledWith('local', 'type', nextSettings)
    expect(appStore.getAppSettings('type')).toEqual(nextSettings)
    expect(appStore.syncQueue).toHaveLength(0)
  })

  it('loads single app settings using local user id when logged out', async () => {
    const appStore = useAppStore()
    const now = new Date().toISOString()

    mockUserSettingsService.getSettings.mockResolvedValue({
      id: 'local_type',
      user_id: 'local',
      app_name: 'type',
      settings: { keyboardLayout: 'azerty' },
      created_at: now,
      updated_at: now,
    })

    await appStore.loadAppSettings('type')

    expect(mockUserSettingsService.getSettings).toHaveBeenCalledWith('local', 'type')
    expect(appStore.getAppSettings('type')).toEqual({ keyboardLayout: 'azerty' })
  })

  it('loads all app settings using local user id when logged out', async () => {
    const appStore = useAppStore()
    const now = new Date().toISOString()

    mockUserSettingsService.getAllUserSettings.mockResolvedValue([
      {
        id: 'local_type',
        user_id: 'local',
        app_name: 'type',
        settings: { keyboardLayout: 'alphabet' },
        created_at: now,
        updated_at: now,
      },
      {
        id: 'local_timer',
        user_id: 'local',
        app_name: 'timer',
        settings: { defaultDuration: 120 },
        created_at: now,
        updated_at: now,
      },
    ])

    await appStore.loadAllAppSettings()

    expect(mockUserSettingsService.getAllUserSettings).toHaveBeenCalledWith('local')
    expect(appStore.getAppSettings('type')).toEqual({ keyboardLayout: 'alphabet' })
    expect(appStore.getAppSettings('timer')).toEqual({ defaultDuration: 120 })
  })
})
