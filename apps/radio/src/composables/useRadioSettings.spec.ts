import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRadioSettings } from './useRadioSettings'

// Shared mock references for assertions
const mockUpdateAppSettings = vi.fn(() => Promise.resolve(true))
const mockLoadAppSettings = vi.fn(() => Promise.resolve(true))
const mockGetAppSettings = vi.fn(() => ({}))

vi.mock('@tiko/core', () => ({
  useAppStore: vi.fn(() => ({
    getAppSettings: mockGetAppSettings,
    updateAppSettings: mockUpdateAppSettings,
    loadAppSettings: mockLoadAppSettings,
  })),
  useAuthStore: vi.fn(() => ({
    user: { id: 'test-user-id' },
  })),
}))

describe('useRadioSettings', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with default settings', () => {
    const { settings } = useRadioSettings()

    expect(settings.value).toEqual({
      autoplayNext: true,
      showTitles: true,
      defaultVolume: 0.8,
      sleepTimerMinutes: 30,
      shuffleMode: false,
      repeatMode: 'none',
    })
  })

  it('provides sleep timer that starts disabled', () => {
    const { sleepTimer } = useRadioSettings()

    expect(sleepTimer.value.enabled).toBe(false)
    expect(sleepTimer.value.minutes).toBe(30)
    expect(sleepTimer.value.startTime).toBeNull()
    expect(sleepTimer.value.endTime).toBeNull()
  })

  it('can set sleep timer', () => {
    const { sleepTimer, setSleepTimer } = useRadioSettings()

    setSleepTimer(15)

    expect(sleepTimer.value.enabled).toBe(true)
    expect(sleepTimer.value.minutes).toBe(15)
    expect(sleepTimer.value.endTime).toBeGreaterThan(Date.now())
  })

  it('can cancel sleep timer', () => {
    const { sleepTimer, setSleepTimer, cancelSleepTimer } = useRadioSettings()

    setSleepTimer(30)
    expect(sleepTimer.value.enabled).toBe(true)

    cancelSleepTimer()
    expect(sleepTimer.value.enabled).toBe(false)
    expect(sleepTimer.value.endTime).toBeNull()
  })

  it('calculates remaining time as 0 when disabled', () => {
    const { sleepTimerRemaining } = useRadioSettings()

    expect(sleepTimerRemaining.value).toBe(0)
  })
})
