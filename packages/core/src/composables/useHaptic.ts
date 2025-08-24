import { ref } from 'vue'

export interface HapticOptions {
  duration?: number | number[]
}


/**
 * Composable for haptic feedback with cross-platform support
 */
export function useHaptic() {
  const isSupported = ref(false)
  
  // Check for native vibration API support
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    isSupported.value = true
  }
  
  /**
   * Trigger haptic feedback
   * @param options - Haptic options
   */
  const vibrate = (options: HapticOptions | number = 10) => {
    // Handle simple number input
    const duration = typeof options === 'number' ? options : (options.duration || 10)
    
    // Try native vibration only
    if (isSupported.value && navigator.vibrate) {
      try {
        navigator.vibrate(duration)
      } catch (error) {
        console.warn('Native vibration failed:', error)
      }
    }
  }
  
  /**
   * Light haptic tap (10ms)
   */
  const tap = () => vibrate(10)
  
  /**
   * Medium haptic impact (20ms)
   */
  const impact = () => vibrate(20)
  
  /**
   * Heavy haptic notification (50ms)
   */
  const notification = () => vibrate(50)
  
  /**
   * Selection changed haptic (light triple tap)
   */
  const selection = () => vibrate({ duration: [10, 10, 10] })
  
  /**
   * Success haptic pattern
   */
  const success = () => vibrate({ duration: [50, 50, 50] })
  
  /**
   * Error haptic pattern
   */
  const error = () => vibrate({ duration: [100, 50, 100] })
  
  /**
   * Warning haptic pattern  
   */
  const warning = () => vibrate({ duration: [50, 100, 50] })
  
  return {
    isSupported,
    vibrate,
    tap,
    impact,
    notification,
    selection,
    success,
    error,
    warning
  }
}