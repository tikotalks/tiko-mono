import { ref } from 'vue'

export interface HapticOptions {
  duration?: number | number[]
  fallbackToAudio?: boolean
}

// Audio context for fallback haptic feedback
let audioContext: AudioContext | null = null

/**
 * Initialize audio context on user interaction
 * This is required for iOS Safari which needs user gesture to start audio
 */
function initAudioContext() {
  if (!audioContext && typeof window !== 'undefined') {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
}

/**
 * Fallback haptic feedback using audio for iOS Safari
 * Creates a low-frequency sound burst that mimics haptic feedback
 */
function audioHapticFeedback(duration: number = 20) {
  try {
    initAudioContext()
    
    if (!audioContext) return
    
    // Resume context if it's suspended (iOS requirement)
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
    
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    // Low frequency square wave for sharp, buzzy feel
    oscillator.type = 'square'
    oscillator.frequency.value = 40 // 40Hz - feels like vibration
    
    // Set volume
    gainNode.gain.value = 0.5 // Not too loud
    
    // Connect nodes
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Play the sound
    oscillator.start()
    oscillator.stop(audioContext.currentTime + (duration / 1000)) // Convert ms to seconds
  } catch (error) {
    console.warn('Audio haptic feedback failed:', error)
  }
}

/**
 * Composable for haptic feedback with cross-platform support
 */
export function useHaptic() {
  const isSupported = ref(false)
  const isAudioFallbackAvailable = ref(false)
  
  // Check for native vibration API support
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    isSupported.value = true
  }
  
  // Check for audio context support (fallback)
  if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
    isAudioFallbackAvailable.value = true
  }
  
  /**
   * Trigger haptic feedback
   * @param options - Haptic options
   */
  const vibrate = (options: HapticOptions | number = 10) => {
    // Handle simple number input
    const duration = typeof options === 'number' ? options : (options.duration || 10)
    const useFallback = typeof options === 'object' ? (options.fallbackToAudio !== false) : true
    
    // Try native vibration first
    if (isSupported.value && navigator.vibrate) {
      try {
        const success = navigator.vibrate(duration)
        if (success) return // Native vibration worked
      } catch (error) {
        console.warn('Native vibration failed:', error)
      }
    }
    
    // Fallback to audio haptic for iOS Safari and other unsupported browsers
    if (useFallback && isAudioFallbackAvailable.value) {
      // For patterns, use the first duration value
      const audioDuration = Array.isArray(duration) ? duration[0] : duration
      audioHapticFeedback(audioDuration)
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
  
  // Initialize audio context on first user interaction
  if (typeof window !== 'undefined') {
    const initOnInteraction = () => {
      initAudioContext()
      // Remove listeners after initialization
      window.removeEventListener('touchstart', initOnInteraction)
      window.removeEventListener('click', initOnInteraction)
    }
    
    window.addEventListener('touchstart', initOnInteraction, { once: true })
    window.addEventListener('click', initOnInteraction, { once: true })
  }
  
  return {
    isSupported,
    isAudioFallbackAvailable,
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