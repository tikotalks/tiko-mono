<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h3 :class="bemm('title')">Timer Settings</h3>
    </div>

    <div :class="bemm('content')">
      <!-- Timer Duration (countdown only) -->
    <div v-if="mode === 'down'" :class="bemm('group')">
      <label :class="bemm('label')">Timer Duration</label>
      <div :class="bemm('time-inputs')">
        <TInput
          v-model="localMinutes"
          type="number"
          :min="0"
          :max="99"
          placeholder="MM"
          :class="bemm('time-input')"
        />
        <span>:</span>
        <TInput
          v-model="localSeconds"
          type="number"
          :min="0"
          :max="59"
          placeholder="SS"
          :class="bemm('time-input')"
        />
      </div>
      <div :class="bemm('time-presets')">
        <button
          v-for="preset in timePresets"
          :key="preset.label"
          type="button"
          :class="bemm('preset-button')"
          @click="setPreset(preset.minutes, preset.seconds)"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>

    <!-- Notifications -->
    <div :class="bemm('group')">
      <label :class="bemm('checkbox')">
        <input 
          v-model="localSettings.soundEnabled"
          type="checkbox"
        />
        Sound notification
      </label>
    </div>

    <div :class="bemm('group')">
      <label :class="bemm('checkbox')">
        <input 
          v-model="localSettings.vibrationEnabled"
          type="checkbox"
        />
        Vibration notification
      </label>
    </div>

    <div :class="bemm('actions')">
      <TButton
        type="default"
        color="primary"
        @click="emit('close')"
        size="medium"
      >
        Close
      </TButton>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useBemm } from 'bemm'
import { TButton, TInput } from '@tiko/ui'
import type { TimerMode, TimerSettings } from '../composables/useTimer'

interface Props {
  mode: TimerMode
  minutes: number
  seconds: number
  settings: TimerSettings
  onApply?: (data: { minutes: number, seconds: number, settings: TimerSettings }) => void
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const bemm = useBemm('timer-settings-form')

// Local state
const localMinutes = ref(props.minutes)
const localSeconds = ref(props.seconds)
const localSettings = reactive({ ...props.settings })

// Time presets
const timePresets = [
  { label: '1m', minutes: 1, seconds: 0 },
  { label: '5m', minutes: 5, seconds: 0 },
  { label: '10m', minutes: 10, seconds: 0 },
  { label: '15m', minutes: 15, seconds: 0 },
  { label: '30m', minutes: 30, seconds: 0 },
  { label: '1h', minutes: 60, seconds: 0 }
]

// Methods
const setPreset = (presetMinutes: number, presetSeconds: number) => {
  localMinutes.value = presetMinutes
  localSeconds.value = presetSeconds
}

const handleApply = () => {
  props.onApply?.({
    minutes: localMinutes.value,
    seconds: localSeconds.value,
    settings: localSettings
  })
  emit('close')
}

// Watch for changes and call onApply
watch([localMinutes, localSeconds, localSettings], () => {
  handleApply()
}, { deep: true })
</script>

<style lang="scss" scoped>
.timer-settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--color-background);
  border-radius: 0.75rem;
  min-width: 400px;
  max-width: 500px;

  &__header {
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 1.5rem;
  }

  &__title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    text-align: center;
    color: var(--color-primary-text);
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__label {
    font-weight: 500;
    color: var(--color-primary-text);
  }

  &__time-inputs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
    margin-bottom: 1rem;

    span {
      font-size: 1.5rem;
      font-weight: 600;
    }
  }

  &__time-input {
    width: 60px;
    padding: 0.5rem;
    border: 2px solid var(--color-border);
    border-radius: 0.5rem;
    text-align: center;
    font-size: 1.25rem;
    font-weight: 600;

    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }

  &__time-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }

  &__preset-button {
    padding: 0.5rem 1rem;
    background: var(--color-accent);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;

    &:hover {
      background: var(--color-primary);
      color: white;
    }
  }

  &__checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;

    input {
      width: 1.25rem;
      height: 1.25rem;
    }

    span {
      font-size: 0.875rem;
    }
  }

  &__actions {
    display: flex;
    justify-content: center;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
    margin-top: 1.5rem;
  }
}
</style>
