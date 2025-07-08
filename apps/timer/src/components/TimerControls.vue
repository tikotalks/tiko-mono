<template>
  <div :class="bemm()">
    <!-- Time Setting -->
    <div :class="bemm('time-setting')">
      <h3 :class="bemm('title')">{{ t('timer.setTime') }}</h3>

      <div :class="bemm('time-inputs')">
        <TInput
          v-model="minutes"
          type="number"
          :label="t('timer.minutes')"
          :min="0"
          :max="59"
          :disabled="isRunning"
          size="large"
          @update:modelValue="updateTime"
        />

        <span :class="bemm('separator')">:</span>

        <TInput
          v-model="seconds"
          type="number"
          :label="t('timer.seconds')"
          :min="0"
          :max="59"
          :disabled="isRunning"
          size="large"
          @update:modelValue="updateTime"
        />
      </div>
    </div>

    <!-- Mode Toggle -->
    <div :class="bemm('mode')">
      <TButton
        :type="mode === 'down' ? 'default' : 'ghost'"
        color="primary"
        :icon="mode === 'down' ? 'arrow-down' : 'arrow-up'"
        @click="toggleMode"
        :disabled="isRunning"
        size="medium"
      >
        {{ mode === 'down' ? t('timer.countDown') : t('timer.countUp') }}
      </TButton>
    </div>

    <!-- Control Buttons -->
    <div :class="bemm('buttons')">
      <TButton
        v-if="!isRunning"
        type="default"
        color="success"
        icon="play"
        @click="start"
        size="large"
        :disabled="targetTime === 0 && mode === 'down'"
      >
        {{ t('timer.start') }}
      </TButton>

      <TButton
        v-else
        type="default"
        color="warning"
        icon="pause"
        @click="pause"
        size="large"
      >
        {{ t('timer.pause') }}
      </TButton>

      <TButton
        type="ghost"
        color="secondary"
        icon="refresh-cw"
        @click="reset"
        size="large"
      >
        {{ t('timer.reset') }}
      </TButton>
    </div>

    <!-- Quick Time Buttons -->
    <div :class="bemm('quick-times')">
      <h4 :class="bemm('subtitle')">{{ t('timer.quickTimes') }}</h4>

      <div :class="bemm('quick-buttons')">
        <TButton
          v-for="quickTime in quickTimes"
          :key="quickTime.seconds"
          type="ghost"
          color="primary"
          size="small"
          @click="() => setQuickTime(quickTime.seconds)"
          :disabled="isRunning"
        >
          {{ quickTime.label }}
        </TButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBemm } from 'bemm'
import { TButton, TInput } from '@tiko/ui'
import { useI18n } from '@tiko/ui/src/composables/useI18n'

interface Props {
  targetTime: number
  mode: 'up' | 'down'
  isRunning: boolean
}

const props = defineProps<Props>()
const bemm = useBemm('timer-controls')
const { t } = useI18n()

const emit = defineEmits<{
  setTime: [minutes: number, seconds: number]
  setMode: [mode: 'up' | 'down']
  start: []
  pause: []
  reset: []
}>()

// Local state for time inputs
const minutes = ref(0)
const seconds = ref(0)

// Quick time presets
const quickTimes = [
  { label: '1 min', seconds: 60 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
  { label: '30 min', seconds: 1800 }
]

// Update local state when target time changes
watch(() => props.targetTime, (newTime) => {
  minutes.value = Math.floor(newTime / 60)
  seconds.value = newTime % 60
}, { immediate: true })

// Methods
const updateTime = () => {
  const mins = Math.max(0, Math.min(59, Number(minutes.value) || 0))
  const secs = Math.max(0, Math.min(59, Number(seconds.value) || 0))

  minutes.value = mins
  seconds.value = secs

  emit('setTime', mins, secs)
}

const toggleMode = () => {
  emit('setMode', props.mode === 'down' ? 'up' : 'down')
}

const start = () => {
  emit('start')
}

const pause = () => {
  emit('pause')
}

const reset = () => {
  emit('reset')
}

const setQuickTime = (totalSeconds: number) => {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60

  minutes.value = mins
  seconds.value = secs

  emit('setTime', mins, secs)
}
</script>

<style lang="scss" scoped>
/**
 * TimerControls component styles following Tiko design system standards
 * - Uses em units and CSS custom properties for spacing
 * - Uses flex + gap for layout instead of margins
 * - Uses semantic colors for theming
 * - Follows BEM methodology
 */
.timer-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg, 2em);
  padding: var(--space, 1.5em);
  background: var(--color-background);
  border-radius: var(--radius-lg, 1em);
  box-shadow: 0 2px 4px color-mix(in srgb, var(--color-foreground), transparent 90%);

  &__time-setting {
    display: flex;
    flex-direction: column;
    gap: var(--space-s, 1em);
  }

  &__title {
    font-size: 1.125em;
    font-weight: 600;
    color: var(--color-foreground);
    text-align: center;
  }

  &__subtitle {
    font-size: 1em;
    font-weight: 500;
    color: var(--color-foreground);
    text-align: center;
  }

  &__time-inputs {
    display: flex;
    align-items: end;
    gap: var(--space-xs, 0.5em);
    justify-content: center;
  }

  &__separator {
    font-size: 2em;
    font-weight: 700;
    color: var(--color-foreground);
    align-self: center;
  }

  &__mode {
    display: flex;
    justify-content: center;
  }

  &__buttons {
    display: flex;
    gap: var(--space-s, 1em);
    justify-content: center;
    flex-wrap: wrap;
  }

  &__quick-times {
    display: flex;
    flex-direction: column;
    gap: var(--space-s, 1em);
  }

  &__quick-buttons {
    display: flex;
    gap: var(--space-xs, 0.5em);
    justify-content: center;
    flex-wrap: wrap;
  }
}

</style>
