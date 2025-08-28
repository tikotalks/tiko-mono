<template>
  <div :class="bemm()">

    <div :class="bemm('container')">

      <!-- Preloading indicator -->
      <div v-if="isPreloading && props.speakOnType" :class="bemm('preload-indicator')">
        Loading audio...
      </div>

      <div :class="bemm('keyboard')">
        <!-- First row -->
        <div :class="bemm('row')">
          <button v-for="key in currentLayout.rows[0]" :key="key.key"
            :class="[bemm('key'), key.modifier ? bemm('key', 'modifier') : '']" @click="handleKeyPress(key)"
            :disabled="disabled">
            <img
              v-if="props.funLetters && funLetters[key.key]"
              :src="funLetters[key.key]"
              :alt="key.key"
              :class="bemm('key-image')"
            />
            <span v-else :class="bemm('key-text')">
              {{ getKeyDisplay(key) }}
            </span>
          </button>
        </div>

        <!-- Second row -->
        <div :class="bemm('row')">
          <button v-for="key in currentLayout.rows[1]" :key="key.key"
            :class="[bemm('key'), key.modifier ? bemm('key', 'modifier') : '']" @click="handleKeyPress(key)"
            :disabled="disabled">
            <img
              v-if="props.funLetters && funLetters[key.key]"
              :src="funLetters[key.key]"
              :alt="key.key"
              :class="bemm('key-image')"
            />
            <span v-else :class="bemm('key-text')">
              {{ getKeyDisplay(key) }}
            </span>
          </button>
        </div>

        <!-- Third row -->
        <div :class="bemm('row')">
          <button v-for="key in currentLayout.rows[2]" :key="key.key"
            :class="[bemm('key'), key.modifier ? bemm('key', 'modifier') : '']" @click="handleKeyPress(key)"
            :disabled="disabled">
            <img
              v-if="props.funLetters && funLetters[key.key]"
              :src="funLetters[key.key]"
              :alt="key.key"
              :class="bemm('key-image')"
            />
            <span v-else :class="bemm('key-text')">
              {{ getKeyDisplay(key) }}
            </span>
          </button>
        </div>

        <!-- Fourth row (spacebar, etc.) -->
        <div :class="bemm('row')">
          <button :class="bemm('key', ['','space'])" @click="handleKeyPress(specialKeys.space)" :disabled="disabled">
            <span :class="bemm('key-text')">
              {{ specialKeys.space.display }}
            </span>
          </button>
          <button :class="bemm('key', ['','backspace'])" @click="handleKeyPress(specialKeys.backspace)" :disabled="disabled">
            <span :class="bemm('key-text')">
              {{ specialKeys.backspace.display }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch, ref } from 'vue'
import { useBemm } from 'bemm'
import {
  funKeyboardIds,
  getKeyboardLayout,
  specialKeys,
  type KeyboardKey,
  type KeyboardLayout
} from './VirtualKeyboard.data'
import { useImageResolver, useSpeak } from '@tiko/core'

interface Props {
  layout?: string
  disabled?: boolean
  theme?: string
  uppercase?: boolean
  hapticFeedback?: boolean
  speakOnType?: boolean
  funLetters?: boolean
  enablePhysicalKeyboard?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'qwerty',
  disabled: false,
  theme: 'default',
  uppercase: false,
  hapticFeedback: true,
  speakOnType: false,
  funLetters: false,
  enablePhysicalKeyboard: true
})

const emit = defineEmits<{
  keypress: [key: string]
  backspace: []
  space: []
}>()

const bemm = useBemm('virtual-keyboard')
const { speak, preloadAudio } = useSpeak()
const { resolveAssetUrl } = useImageResolver()



// Track preloading state
const isPreloading = ref(false)
const preloadedKeys = ref<Set<string>>(new Set())

const currentLayout = computed(() => {
  return getKeyboardLayout(props.layout)
})

const getKeyDisplay = (key: KeyboardKey): string => {
  const display = key.display || key.key
  return props.uppercase ? display.toUpperCase() : display
}

// Fun letters
const funLetters = ref<Record<string, string>>({})

const loadFunLetterData = async () => {
  if (!props.funLetters) return

  const allLetters: string[] = []

  // Collect all letters from the keyboard layout
  currentLayout.value.rows.forEach((row) => {
    row.forEach((key) => {
      // Only add regular letter keys (single character, not special keys)
      if (key.key.length === 1 && !key.modifier) {
        allLetters.push(key.key.toLowerCase())
      }
    })
  })

  // Remove duplicates
  const uniqueLetters = [...new Set(allLetters)]

  // Initialize funLetters object
  const letterUrls: Record<string, string> = {}

  // Load fun letter images for each unique letter
  await Promise.all(uniqueLetters.map(async (letter) => {
    const letterId = funKeyboardIds[letter as keyof typeof funKeyboardIds]
    if (letterId) {
      const letterUrl = await resolveAssetUrl(letterId, { media: 'public', size: 'small' })
      letterUrls[letter] = letterUrl
      // Also add uppercase version
      letterUrls[letter.toUpperCase()] = letterUrl
    }
  }))

  funLetters.value = letterUrls
}

const usePhysicalKeyboard = () => {
  const handlePhysicalKey = (event: KeyboardEvent) => {
    // Don't process if disabled or if user is typing in an input or textarea
    if (props.disabled) return
    
    if (event.target && ['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) {
      return
    }

    // Handle letter keys
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      const key = props.uppercase ? event.key.toUpperCase() : event.key
      handleKeyPress({ key, display: key })
    }
    // Handle special keys
    else if (event.key === 'Backspace') {
      event.preventDefault()
      handleKeyPress(specialKeys.backspace)
    }
    else if (event.key === ' ') {
      event.preventDefault()
      handleKeyPress(specialKeys.space)
    }
  }

  window.addEventListener('keydown', handlePhysicalKey)
  
  // Return cleanup function
  return () => {
    window.removeEventListener('keydown', handlePhysicalKey)
  }
}



// Preload audio for all keys in the current layout
const preloadLayoutAudio = async () => {
  if (!props.speakOnType) return

  console.log('[VirtualKeyboard] Starting audio preload for layout:', props.layout)
  isPreloading.value = true
  preloadedKeys.value.clear()

  try {
    // Collect all unique keys from the layout
    const keysToPreload: Array<{ text: string; language?: string }> = []

    // Add regular keys
    currentLayout.value.rows.forEach(row => {
      row.forEach(key => {
        const keyText = key.key
        // Add lowercase version
        keysToPreload.push({ text: `[letter] ${keyText}` })
        // Add uppercase version if different
        const uppercaseKey = keyText.toUpperCase()
        if (uppercaseKey !== keyText) {
          keysToPreload.push({ text: `[letter] ${uppercaseKey}` })
        }
      })
    })

    // Add special keys that might be spoken
    keysToPreload.push({ text: 'Space' })
    keysToPreload.push({ text: 'Backspace' })

    // Preload all audio
    await preloadAudio(keysToPreload)

    // Mark all keys as preloaded
    keysToPreload.forEach(item => {
      preloadedKeys.value.add(item.text)
    })

    console.log('[VirtualKeyboard] Audio preload complete. Preloaded', keysToPreload.length, 'items')
  } catch (error) {
    console.error('[VirtualKeyboard] Error preloading audio:', error)
  } finally {
    isPreloading.value = false
  }
}

// Watch for layout changes
watch(() => props.layout, () => {
  preloadLayoutAudio()
  loadFunLetterData()
})

// Watch for speakOnType changes
watch(() => props.speakOnType, (newValue) => {
  if (newValue) {
    preloadLayoutAudio()
  }
})

// Watch for funLetters changes
watch(() => props.funLetters, (newValue) => {
  if (newValue) {
    loadFunLetterData()
  }
})

// Store cleanup function for physical keyboard
let cleanupPhysicalKeyboard: (() => void) | null = null

// Initial preload on mount
onMounted(() => {
  if (props.speakOnType) {
    preloadLayoutAudio()
  }
  loadFunLetterData()
  
  // Only enable physical keyboard if the prop is true
  if (props.enablePhysicalKeyboard) {
    cleanupPhysicalKeyboard = usePhysicalKeyboard()
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (cleanupPhysicalKeyboard) {
    cleanupPhysicalKeyboard()
  }
})

const triggerHapticFeedback = () => {
  if (!props.hapticFeedback) return

  // Web Vibration API
  if ('vibrate' in navigator) {
    navigator.vibrate(50) // 50ms vibration
  }
}

const speakKey = (key: string) => {
  if (!props.speakOnType) return

    speak(`[letter] ${key}`);

}

const handleKeyPress = (key: KeyboardKey | { key: string; display: string }) => {
  if (props.disabled) return

  const keyValue = key.key

  // Trigger haptic feedback for all key presses
  triggerHapticFeedback()


  if (keyValue === 'Backspace') {
    emit('backspace')
  } else if (keyValue === ' ') {
    emit('space')
  } else {
    const outputKey = props.uppercase ? keyValue.toUpperCase() : keyValue
    speakKey(outputKey)
    emit('keypress', outputKey)
  }
}
</script>

<style lang="scss">
.virtual-keyboard {

  --keyboard-gap: var(--space-xs);
  --keyboard-radius: calc(var(--border-radius) / 2);

  --keyboard-key-color: var(--color-secondary);
  --keyboard-key-text-color: var(--color-secondary-text);
  --keyboard-key-color--hover: var(--color-primary);
  --keyboard-key-text-color--hover: var(--color-primary-text);

  --keyboard-shadow-size: 4px;

  width: 100%;
  height: auto; /* Let content determine height */
  min-height: 0; /* Allow it to be as small as needed */

  padding: var(--space);
  user-select: none;
  -webkit-user-select: none; /* iOS Safari */
  touch-action: pan-y; /* Allow vertical scrolling but prevent zoom */

  @media screen and (max-width: 960px) {
    padding: var(--space-xs);
  }

  &__container {
    border-radius: var(--border-radius);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: var(--space);
    background: color-mix(in srgb, var(--color-background), transparent 50%);
    backdrop-filter: blur(4px);
    position: relative;
    z-index: 20; /* Ensure it's above other elements */

    @media screen and (max-width: 960px) {
      padding: var(--space-s);
    }
    
    /* iOS specific fixes */
    @supports (-webkit-touch-callout: none) {
      /* Ensure keyboard is visible on iOS */
      transform: translate3d(0, 0, 0); /* Force GPU acceleration */
      -webkit-transform: translate3d(0, 0, 0);
    }
  }

  &__preload-indicator {
    position: absolute;
    top: var(--space-s);
    right: var(--space-s);
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    background: var(--color-background);
    padding: var(--space-xs) var(--space-s);
    border-radius: var(--border-radius);
    animation: pulse 1.5s ease-in-out infinite;

    @keyframes pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
  }

  &__keyboard {
    display: flex;
    flex-direction: column;
    gap: var(--keyboard-gap);
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    
    /* Ensure keyboard fits on iPad landscape */
    @media screen and (orientation: landscape) and (max-height: 850px) {
      max-width: 900px; /* Slightly smaller on landscape tablets */
    }
  }

  &__row {
    --keyboard-key-size: calc((100% - 20%) / 10);

    display: flex;
    justify-content: center;
    gap: var(--keyboard-gap);
    width: 100%;
  }

  &__key {
    --keyboard-key-color-shadow:  color-mix(in srgb, var(--keyboard-key-color), var(--color-dark) 50%);

    width: var(--keyboard-key-size);
    aspect-ratio: var(--keyboard-key-aspect-ratio, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--keyboard-key-color), transparent 50%);
    background-image: radial-gradient(var(--keyboard-key-color), color-mix(in srgb, var(--keyboard-key-color), var(--color-background) 25%));
    color: var(--keyboard-key-text-color);
    box-shadow: 0 calc(var(--keyboard-shadow-size) * -1) 0 0 var(--keyboard-key-color-shadow) inset;
    border: none;
    border-radius: var(--keyboard-radius);
    font-size: clamp(1.5rem, 2.5vw, 3rem);
    font-weight: 600;
    color: var(--color-foreground);
    cursor: pointer;
    transition: all 0.15s ease;
    touch-action: manipulation;

    &:hover {
      --keyboard-key-text-color: var(--keyboard-key-text-color--hover);
      --keyboard-key-color: var(--keyboard-key-color--hover);
    }

    &:active {
      transform: translateY(calc(var(--keyboard-shadow-size) / 2));
      box-shadow: 0 calc((var(--keyboard-shadow-size) * -1) / 2) 0 0 var(--keyboard-key-color-shadow) inset;
    }
    
    /* iOS touch highlight fix */
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;


    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    &--space {
      --keyboard-key-color: var(--color-primary);

      width: calc(var(--keyboard-key-size) * 5 + (var(--keyboard-gap) * 4));
      aspect-ratio: 5 / 1;
      border-radius: var(--keyboard-radius);
      border: none;
    }

    &--backspace {
      --keyboard-key-color: var(--color-error);
      --keyboard-key-text-color: var(--color-error-text);

      width: calc(var(--keyboard-key-size) * 1.5 + var(--keyboard-gap));
      aspect-ratio: 2 / 1;

      border-radius: var(--keyboard-radius);

      border: none;

      &:hover {
        background: var(--color-error);
      }
    }

    &--modifier {
      background: var(--color-warning);
      color: var(--color-warning-contrast);
      width: calc(var(--key-size) * 1.5 + var(--keyboard-gap));
      aspect-ratio: 1.5 / 1;

      border: none;

      &:hover {
        background: var(--color-warning-dark);
      }
    }
  }

  &__key-text{
    transform: translateY(calc((var(--keyboard-shadow-size) / 2) * -1));
    text-shadow: 1px 1px 2px color-mix(in srgb, var(--color-dark), transparent 50%);
  }

  &__key-image {
    width: 80%;
    height: 80%;
    object-fit: contain;
    transform: translateY(calc((var(--keyboard-shadow-size) / 2) * -1));
  }

  // Preload indicator
  &__preload-indicator {
    position: absolute;
    top: var(--space-s);
    right: var(--space-s);
    background: var(--color-primary);
    color: var(--color-primary-contrast);
    padding: var(--space-xs) var(--space-s);
    border-radius: var(--border-radius);
    font-size: 0.875rem;
    animation: pulse 1.5s ease-in-out infinite;
    z-index: 10;

    @keyframes pulse {
      0%, 100% {
        opacity: 0.8;
      }
      50% {
        opacity: 1;
      }
    }
  }
  @media screen and (max-width: 720px){
    --keyboard-key-aspect-ratio: 3/4;
    --keyboard-gap: var(--space-xs);
  }
  
  /* iPad landscape specific adjustments */
  @media screen and (orientation: landscape) and (max-height: 850px) {
    --keyboard-key-aspect-ratio: 4/3; /* Wider keys on landscape */
    
    .virtual-keyboard__key {
      font-size: clamp(1.2rem, 2vw, 2rem); /* Smaller font on landscape */
    }
  }
}
</style>
