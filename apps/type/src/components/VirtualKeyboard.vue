<template>
  <div :class="bemm()">

    <div :class="bemm('container')">

      <div :class="bemm('keyboard')">
        <!-- First row -->
        <div :class="bemm('row')">
          <button v-for="key in currentLayout.rows[0]" :key="key.key"
            :class="[bemm('key'), key.modifier ? bemm('key', 'modifier') : '']" @click="handleKeyPress(key)"
            :disabled="disabled">
            {{ getKeyDisplay(key) }}
          </button>
        </div>

        <!-- Second row -->
        <div :class="bemm('row')">
          <button v-for="key in currentLayout.rows[1]" :key="key.key"
            :class="[bemm('key'), key.modifier ? bemm('key', 'modifier') : '']" @click="handleKeyPress(key)"
            :disabled="disabled">
            {{ getKeyDisplay(key) }}
          </button>
        </div>

        <!-- Third row -->
        <div :class="bemm('row')">
          <button v-for="key in currentLayout.rows[2]" :key="key.key"
            :class="[bemm('key'), key.modifier ? bemm('key', 'modifier') : '']" @click="handleKeyPress(key)"
            :disabled="disabled">
            {{ getKeyDisplay(key) }}
          </button>
        </div>

        <!-- Fourth row (spacebar, etc.) -->
        <div :class="bemm('row')">
          <button :class="bemm('key', ['','space'])" @click="handleKeyPress(specialKeys.space)" :disabled="disabled">
            {{ specialKeys.space.display }}
          </button>
          <button :class="bemm('key', ['','backspace'])" @click="handleKeyPress(specialKeys.backspace)" :disabled="disabled">
            {{ specialKeys.backspace.display }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBemm } from 'bemm'
import {
  getKeyboardLayout,
  specialKeys,
  type KeyboardKey,
  type KeyboardLayout
} from './VirtualKeyboard.data'

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

const currentLayout = computed(() => {
  return getKeyboardLayout(props.layout)
})

const getKeyDisplay = (key: KeyboardKey): string => {
  const display = key.display || key.key
  return props.uppercase ? display.toUpperCase() : display
}

const triggerHapticFeedback = () => {
  if (!props.hapticFeedback) return

  // Web Vibration API
  if ('vibrate' in navigator) {
    navigator.vibrate(50) // 50ms vibration
  }
}

const speakKey = (key: string) => {
  if (!props.speakOnType) return

  // Only speak letters and numbers, not special keys
  if (key.length === 1 && /[a-zA-Z0-9]/.test(key)) {
    const utterance = new SpeechSynthesisUtterance(key.toUpperCase())
    utterance.rate = 1.5
    utterance.volume = 0.7
    speechSynthesis.speak(utterance)
  }
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

    @media screen and (max-width: 960px) {
      padding: var(--space-s);
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
    display: flex;
    justify-content: center;
    gap: var(--keyboard-gap);
    width: 100%;

    // Calculate key size based on available width
    // First row has 10 keys, so each key = (100% - 9 gaps) / 10
    --key-size: calc((100% - 20%) / 10);
  }

  &__key {
    width: var(--key-size);
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--keyboard-key-color), transparent 50%);
    color: var(--keyboard-key-text-color);
    border: 1px solid var(--keyboard-key-color);
    border-radius: var(--keyboard-radius);
    font-size: clamp(1rem, 2.5vw, 2rem);
    font-weight: 600;
    color: var(--color-foreground);
    cursor: pointer;
    transition: all 0.15s ease;
    touch-action: manipulation;

    &:hover {
      --keyboard-key-text-color: var(--keyboard-key-text-color--hover);
      --keyboard-key-color: var(--keyboard-key-color--hover);

      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    &--space {
      width: calc(var(--key-size) * 5 + 8%); // 5 keys wide + 4 gaps
      aspect-ratio: 5 / 1;
      border-radius: var(--keyboard-radius);
      border: none;

    }

    &--backspace {
      width: calc(var(--key-size) * 2 + 2%); // 2 keys wide + 1 gap
      aspect-ratio: 2 / 1;
      background: var(--color-error);
      color: var(--color-error-contrast);
      border-radius: var(--keyboard-radius);

      border: none;

      &:hover {
        background: var(--color-error-dark);
      }
    }

    &--modifier {
      background: var(--color-warning);
      color: var(--color-warning-contrast);
      width: calc(var(--key-size) * 1.5 + 1%);
      aspect-ratio: 1.5 / 1;

      border: none;

      &:hover {
        background: var(--color-warning-dark);
      }
    }
  }

  // For smaller screens, reduce gaps
  @media (max-width: 768px) {
    &__keyboard {}

    &__row {

      --key-size: calc((100% - 9%) / 10);
    }

    &__key {

      &--space {
        width: calc(var(--key-size) * 5 + 4%);
      }

      &--backspace {
        width: calc(var(--key-size) * 2 + 1%);
      }
    }
  }
}
</style>
