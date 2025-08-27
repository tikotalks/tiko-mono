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
            <span :class="bemm('key-text')">
              {{ getKeyDisplay(key) }}
            </span>
          </button>
        </div>

        <!-- Second row -->
        <div :class="bemm('row')">
          <button v-for="key in currentLayout.rows[1]" :key="key.key"
            :class="[bemm('key'), key.modifier ? bemm('key', 'modifier') : '']" @click="handleKeyPress(key)"
            :disabled="disabled">
            <span :class="bemm('key-text')">
              {{ getKeyDisplay(key) }}
            </span>
          </button>
        </div>

        <!-- Third row -->
        <div :class="bemm('row')">
          <button v-for="key in currentLayout.rows[2]" :key="key.key"
            :class="[bemm('key'), key.modifier ? bemm('key', 'modifier') : '']" @click="handleKeyPress(key)"
            :disabled="disabled">
            <span :class="bemm('key-text')">
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
import { computed, onMounted, watch, ref } from 'vue'
import { useBemm } from 'bemm'
import {
  getKeyboardLayout,
  specialKeys,
  type KeyboardKey,
  type KeyboardLayout
} from './VirtualKeyboard.data'
import { useSpeak } from '@tiko/core'

interface Props {
  layout?: string
  disabled?: boolean
  theme?: string
  uppercase?: boolean
  hapticFeedback?: boolean
  speakOnType?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'qwerty',
  disabled: false,
  theme: 'default',
  uppercase: false,
  hapticFeedback: true,
  speakOnType: false
})

const emit = defineEmits<{
  keypress: [key: string]
  backspace: []
  space: []
}>()

const bemm = useBemm('virtual-keyboard')
const { speak, preloadAudio } = useSpeak()

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
})

// Watch for speakOnType changes
watch(() => props.speakOnType, (newValue) => {
  if (newValue) {
    preloadLayoutAudio()
  }
})

// Initial preload on mount
onMounted(() => {
  if (props.speakOnType) {
    preloadLayoutAudio()
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
  height: 100%;

  padding: var(--space);
  user-select: none;

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

    @media screen and (max-width: 960px) {
      padding: var(--space-s);
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
}
</style>
