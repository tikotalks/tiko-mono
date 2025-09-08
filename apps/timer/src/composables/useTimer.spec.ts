import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useTimer } from './useTimer'

// Mock the composable to avoid Vue lifecycle issues
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onMounted: vi.fn(),
    onUnmounted: vi.fn(),
  }
})

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    // Reset timer state
    const { reset } = useTimer()
    reset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with default values', () => {
    const { currentTime, targetTime, mode, isRunning, isExpired } = useTimer()

    expect(currentTime.value).toBe(0)
    expect(targetTime.value).toBe(600) // 10 minutes
    expect(mode.value).toBe('down')
    expect(isRunning.value).toBe(false)
    expect(isExpired.value).toBe(false)
  })

  it('formats time correctly', () => {
    const { formattedTime, setTime } = useTimer()

    expect(formattedTime.value).toBe('10:00')

    setTime(1, 5) // 1 minute 5 seconds
    expect(formattedTime.value).toBe('01:05')

    setTime(0, 0)
    expect(formattedTime.value).toBe('00:00')
  })

  it('starts and stops timer correctly', () => {
    const { start, pause, isRunning } = useTimer()

    expect(isRunning.value).toBe(false)

    start()
    expect(isRunning.value).toBe(true)

    pause()
    expect(isRunning.value).toBe(false)
  })

  it('counts down in down mode', () => {
    const { start, currentTime, displayTime, setTime } = useTimer()

    setTime(0, 5) // 5 seconds
    start()

    expect(displayTime.value).toBe(5)

    vi.advanceTimersByTime(1000)
    expect(currentTime.value).toBe(1)
    expect(displayTime.value).toBe(4)

    vi.advanceTimersByTime(4000)
    expect(currentTime.value).toBe(5)
    expect(displayTime.value).toBe(0)
  })

  it('counts up in up mode', () => {
    const { start, currentTime, displayTime, setMode } = useTimer()

    setMode('up')
    start()

    expect(displayTime.value).toBe(0)

    vi.advanceTimersByTime(3000)
    expect(currentTime.value).toBe(3)
    expect(displayTime.value).toBe(3)
  })

  it('calculates progress correctly in down mode', () => {
    const { start, progress, setTime, isRunning, currentTime, targetTime, mode, setMode } =
      useTimer()

    // Ensure we're in down mode
    setMode('down')
    setTime(0, 10) // 10 seconds
    expect(progress.value).toBe(0)

    start()
    expect(isRunning.value).toBe(true)

    vi.advanceTimersByTime(5000)
    expect(progress.value).toBe(50)

    vi.advanceTimersByTime(5000)
    expect(progress.value).toBe(100)
  })

  it('handles timer expiration', () => {
    const { start, isExpired, setTime, setMode } = useTimer()

    // Ensure we're in down mode for expiration to work
    setMode('down')
    setTime(0, 2) // 2 seconds
    start()

    expect(isExpired.value).toBe(false)

    vi.advanceTimersByTime(3000)
    expect(isExpired.value).toBe(true)
  })

  it('resets timer properly', () => {
    const { start, reset, currentTime, isRunning, isExpired, setTime } = useTimer()

    setTime(0, 5) // 5 seconds
    start()
    vi.advanceTimersByTime(3000)

    expect(currentTime.value).toBe(3)
    expect(isRunning.value).toBe(true)

    reset()

    expect(currentTime.value).toBe(0)
    expect(isRunning.value).toBe(false)
    expect(isExpired.value).toBe(false)
  })

  it('updates settings correctly', () => {
    const { settings, updateSettings } = useTimer()

    expect(settings.value.soundEnabled).toBe(true)
    expect(settings.value.vibrationEnabled).toBe(true)

    updateSettings({ soundEnabled: false })

    expect(settings.value.soundEnabled).toBe(false)
    expect(settings.value.vibrationEnabled).toBe(true)
  })
})
