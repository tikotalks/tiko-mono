<template>
  <div :class="bemm()">
    <!-- Time Setting -->
    <div :class="bemm('time-setting')">
      <h3 :class="bemm('title')">Set Time</h3>
      
      <div :class="bemm('time-inputs')">
        <TInput
          v-model="minutes"
          type="number"
          label="Minutes"
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
          label="Seconds"
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
        :label="mode === 'down' ? 'Count Down' : 'Count Up'"
        :type="mode === 'down' ? 'default' : 'ghost'"
        color="primary"
        :icon="mode === 'down' ? 'arrow-down' : 'arrow-up'"
        :action="toggleMode"
        :disabled="isRunning"
        size="medium"
      />
    </div>
    
    <!-- Control Buttons -->
    <div :class="bemm('buttons')">
      <TButton
        v-if="!isRunning"
        label="Start"
        type="fancy"
        color="success"
        icon="play"
        :action="start"
        size="large"
        :disabled="targetTime === 0 && mode === 'down'"
      />
      
      <TButton
        v-else
        label="Pause"
        type="fancy"
        color="warning"
        icon="pause"
        :action="pause"
        size="large"
      />
      
      <TButton
        label="Reset"
        type="ghost"
        color="secondary"
        icon="refresh-cw"
        :action="reset"
        size="large"
      />
    </div>
    
    <!-- Quick Time Buttons -->
    <div :class="bemm('quick-times')">
      <h4 :class="bemm('subtitle')">Quick Times</h4>
      
      <div :class="bemm('quick-buttons')">
        <TButton
          v-for="quickTime in quickTimes"
          :key="quickTime.seconds"
          :label="quickTime.label"
          type="ghost"
          color="primary"
          size="small"
          :action="() => setQuickTime(quickTime.seconds)"
          :disabled="isRunning"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBemm } from 'bemm'
import { TButton, TInput } from '@tiko/ui'

interface Props {
  targetTime: number
  mode: 'up' | 'down'
  isRunning: boolean
}

const props = defineProps<Props>()
const bemm = useBemm('timer-controls')

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
.timer-controls {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &__title {
    margin: 0 0 1rem;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    text-align: center;
  }
  
  &__subtitle {
    margin: 0 0 0.75rem;
    font-size: 1rem;
    font-weight: 500;
    color: var(--text-primary);
    text-align: center;
  }
  
  &__time-inputs {
    display: flex;
    align-items: end;
    gap: 0.5rem;
    justify-content: center;
  }
  
  &__separator {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }
  
  &__mode {
    display: flex;
    justify-content: center;
  }
  
  &__buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  &__quick-buttons {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
  }
}

// Mobile responsiveness
@media (max-width: 768px) {
  .timer-controls {
    padding: 1rem;
    gap: 1.5rem;
    
    &__buttons {
      flex-direction: column;
      align-items: center;
      
      .button {
        width: 100%;
        max-width: 200px;
      }
    }
    
    &__quick-buttons {
      gap: 0.25rem;
      
      .button {
        flex: 1;
        min-width: 0;
      }
    }
  }
}
</style>