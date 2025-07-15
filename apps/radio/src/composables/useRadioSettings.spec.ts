import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRadioSettings } from './useRadioSettings'

// Mock the @tiko/core module
vi.mock('@tiko/core', () => ({
  useAuthStore: vi.fn(() => ({
    user: { value: { id: 'test-user-id' } }
  })),
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }
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
      repeatMode: 'none'
    })
  })

  it('returns correct default settings when user is not logged in', () => {
    const { settings } = useRadioSettings()
    
    expect(settings.value.autoplayNext).toBe(true)
    expect(settings.value.defaultVolume).toBe(0.8)
  })

  it('provides sleep timer functionality', () => {
    const { sleepTimer, setSleepTimer } = useRadioSettings()
    
    expect(sleepTimer.value.isActive).toBe(false)
    
    setSleepTimer(15)
    
    expect(sleepTimer.value.isActive).toBe(true)
    expect(sleepTimer.value.remainingMinutes).toBe(15)
  })

  it('can clear sleep timer', () => {
    const { sleepTimer, setSleepTimer, cancelSleepTimer } = useRadioSettings()
    
    setSleepTimer(30)
    expect(sleepTimer.value.isActive).toBe(true)
    
    cancelSleepTimer()
    expect(sleepTimer.value.isActive).toBe(false)
  })

  it('calculates remaining time correctly', () => {
    const { sleepTimer, setSleepTimer } = useRadioSettings()
    
    expect(sleepTimer.value.remainingMinutes).toBe(0)
    
    setSleepTimer(10)
    
    // Should have 10 minutes
    expect(sleepTimer.value.remainingMinutes).toBe(10)
  })
})