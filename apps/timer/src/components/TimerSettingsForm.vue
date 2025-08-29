<template>
  <div :class="bemm()">
    <div :class="bemm('content')">
      <!-- Timer Duration (countdown only) -->
      <div v-if="mode === 'down'" :class="bemm('group')">
        <label :class="bemm('label')">{{ t('timer.timerDuration') }}</label>
        <div :class="bemm('time-inputs')">
          <TInputNumber v-model="localMinutes" type="number" :min="0" :max="99" placeholder="MM"
            :class="bemm('time-input')" />
          <span>:</span>
          <TInputNumber v-model="localSeconds" type="number" :min="0" :max="59" placeholder="SS"
            :class="bemm('time-input')" />
        </div>
        <div :class="bemm('time-presets')">
          <TButton v-for="preset in timePresets" :key="preset.label" :size="'small'" :class="bemm('preset-button')"
            @click="setPreset(preset.minutes, preset.seconds)">
            {{ preset.label }}
          </TButton>
        </div>
      </div>

      <!-- Notifications -->
      <TInputCheckbox v-model="localSettings.soundEnabled" :label="t('timer.soundNotification')"
        :class="bemm('checkbox')" />

      <TInputCheckbox v-model="localSettings.vibrationEnabled" :label="t('timer.vibrationNotification')"
        :class="bemm('checkbox')" />

      <div :class="bemm('actions')">
        <TButton type="default" color="primary" @click="handleClose" size="medium">
          {{ t('common.close') }}
        </TButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useBemm } from 'bemm'
import { useI18n } from '@tiko/core';
import { TButton, TInputCheckbox, TInputNumber } from '@tiko/ui'
import type { TimerMode, TimerSettings } from '../composables/useTimer'

interface Props {
  mode: TimerMode
  minutes: number
  seconds: number
  settings: TimerSettings
  onApply?: (data: { minutes: number, seconds: number, settings: TimerSettings }) => void
  onClose?: () => void
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const bemm = useBemm('timer-settings-form')
const { t } = useI18n()

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


const handleClose = () => {
  props.onClose?.()
  emit('close')
}

// Auto-apply changes when user finishes making changes (with debounce)
let applyTimeout: NodeJS.Timeout | null = null
watch([localMinutes, localSeconds, localSettings], () => {
  if (applyTimeout) {
    clearTimeout(applyTimeout)
  }
  applyTimeout = setTimeout(() => {
    // Auto-apply settings changes (but don't close modal)
    props.onApply?.({
      minutes: localMinutes.value,
      seconds: localSeconds.value,
      settings: localSettings
    })
  }, 500) // Apply changes after 500ms of no changes
}, { deep: true })
</script>

<style lang="scss">
.timer-settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--color-background);
  border-radius: 0.75rem;
  min-width: 400px;
  max-width: 500px;

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
    gap: var(--space-s);
    justify-content: center;
    margin-bottom: 1rem;

    span {
      font-size: 1.5rem;
      font-weight: 600;
    }
  }


  &__time-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }




  &__actions {
    display: flex;
    justify-content: center;
    padding-top: 1rem;
    border-top: 1px solid var(--color-accent);
    margin-top: 1.5rem;
  }
}
</style>
