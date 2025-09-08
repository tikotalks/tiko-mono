import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRadioSettings } from './useRadioSettings'

// Mock the @tiko/core module
vi.mock('@tiko/core', () => ({
  useAuthStore: vi.fn(() => ({
    user: { value: { id: 'test-user-id' } },
  })),
  userSettingsService: {
    getSettings: vi.fn(() => Promise.resolve(null)),
    updateSettings: vi.fn(() => Promise.resolve({ data: null, error: null })),
  },
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}))

describe('useRadioSettings', () => {
  beforeEach(() => {
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

  it('returns correct default settings when user is not logged in', () => {
    const { settings } = useRadioSettings()

    expect(settings.value.autoplayNext).toBe(true)
    expect(settings.value.defaultVolume).toBe(0.8)
  })

  it('provides sleep timer functionality', () => {
    const { sleepTimer, setSleepTimer } = useRadioSettings()

    expect(sleepTimer.value.enabled).toBe(false)

    setSleepTimer(15)

    expect(sleepTimer.value.enabled).toBe(true)
    expect(sleepTimer.value.minutes).toBe(15)
  })

  it('can clear sleep timer', () => {
    const { sleepTimer, setSleepTimer, cancelSleepTimer } = useRadioSettings()

    setSleepTimer(30)
    expect(sleepTimer.value.enabled).toBe(true)

    cancelSleepTimer()
    expect(sleepTimer.value.enabled).toBe(false)
  })

  it('calculates remaining time correctly', () => {
    const { sleepTimerRemaining, setSleepTimer } = useRadioSettings()

    expect(sleepTimerRemaining.value).toBe(0)

    setSleepTimer(10)

    // Should have approximately 10 minutes (might be slightly less due to execution time)
    expect(sleepTimerRemaining.value).toBeGreaterThanOrEqual(9)
    expect(sleepTimerRemaining.value).toBeLessThanOrEqual(10)
  })
})
