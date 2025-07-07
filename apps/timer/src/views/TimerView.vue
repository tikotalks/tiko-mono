<template>
  <div class="timer-view">
    <!-- Header -->
    <header class="timer-header">
      <h1 class="timer-header__title">Timer</h1>
      
      <TButton
        icon="settings"
        type="ghost"
        size="medium"
        color="secondary"
        :action="toggleSettings"
        aria-label="Settings"
      />
    </header>

    <!-- Main Timer Display -->
    <main class="timer-main">
      <TimeDisplay
        :display-time="displayTime"
        :progress="progress"
        :mode="mode"
        :is-expired="isExpired"
        :is-running="isRunning"
      />
      
      <TimerControls
        :target-time="targetTime"
        :mode="mode"
        :is-running="isRunning"
        @set-time="setTime"
        @set-mode="setMode"
        @start="start"
        @pause="pause"
        @reset="reset"
      />
    </main>

    <!-- Settings Panel -->
    <div v-if="showSettings" class="timer-settings">
      <div class="timer-settings__backdrop" @click="hideSettings" />
      <div class="timer-settings__panel">
        <h3 class="timer-settings__title">Timer Settings</h3>
        
        <div class="timer-settings__group">
          <label class="timer-settings__checkbox">
            <input
              v-model="localSettings.soundEnabled"
              type="checkbox"
              @change="updateSettings"
            />
            <span>Sound notification</span>
          </label>
        </div>
        
        <div class="timer-settings__group">
          <label class="timer-settings__checkbox">
            <input
              v-model="localSettings.vibrationEnabled"
              type="checkbox"
              @change="updateSettings"
            />
            <span>Vibration notification</span>
          </label>
        </div>
        
        <div class="timer-settings__actions">
          <TButton
            label="Close"
            type="default"
            color="primary"
            :action="hideSettings"
            size="medium"
          />
        </div>
      </div>
    </div>

    <!-- Expired Overlay -->
    <div v-if="isExpired" class="timer-expired">
      <div class="timer-expired__content">
        <TIcon name="clock" size="4rem" />
        <h2 class="timer-expired__title">Time's Up!</h2>
        <p class="timer-expired__message">
          {{ mode === 'down' ? 'Your countdown has finished' : 'Timer notification' }}
        </p>
        
        <TButton
          label="Dismiss"
          type="fancy"
          color="primary"
          :action="dismissExpired"
          size="large"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive, watch, toRefs } from 'vue'
import { TButton, TIcon } from '@tiko/ui'
import { useTimerStore } from '../stores/timer'
import TimeDisplay from '../components/TimeDisplay.vue'
import TimerControls from '../components/TimerControls.vue'

const timerStore = useTimerStore()

// Local state
const showSettings = ref(false)

// Local settings copy for immediate UI updates
const localSettings = reactive({
  soundEnabled: true,
  vibrationEnabled: true,
  defaultTime: 300
})

// Destructure store
const {
  currentTime,
  targetTime,
  mode,
  isRunning,
  hasExpired,
  settings,
  displayTime,
  progress,
  isExpired
} = toRefs(timerStore)

// Watch settings and update local copy
watch(settings, (newSettings) => {
  Object.assign(localSettings, newSettings)
}, { immediate: true })

// Methods
const setTime = (minutes: number, seconds: number) => {
  timerStore.setTime(minutes, seconds)
}

const setMode = (newMode: 'up' | 'down') => {
  timerStore.setMode(newMode)
}

const start = () => {
  timerStore.start()
}

const pause = () => {
  timerStore.pause()
}

const reset = () => {
  timerStore.reset()
}

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const hideSettings = () => {
  showSettings.value = false
}

const updateSettings = async () => {
  await timerStore.updateSettings(localSettings)
}

const dismissExpired = () => {
  timerStore.reset()
}

// Initialize and cleanup
onMounted(async () => {
  await timerStore.loadState()
})

onUnmounted(() => {
  timerStore.cleanup()
})

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (event.target && (event.target as HTMLElement).tagName === 'INPUT') {
    return // Don't interfere with input fields
  }
  
  switch (event.key) {
    case ' ':
      event.preventDefault()
      if (isRunning.value) {
        pause()
      } else {
        start()
      }
      break
    case 'r':
      event.preventDefault()
      reset()
      break
    case 'Escape':
      if (showSettings.value) {
        hideSettings()
      } else if (isExpired.value) {
        dismissExpired()
      }
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
.timer-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

.timer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  position: relative;
  z-index: 10;
  
  &__title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
  }
}

.timer-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 2rem;
}

// Settings panel
.timer-settings {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  
  &__backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
  }
  
  &__panel {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    min-width: 300px;
    max-width: 90vw;
  }
  
  &__title {
    margin: 0 0 1.5rem;
    font-size: 1.25rem;
    font-weight: 600;
    text-align: center;
  }
  
  &__group {
    margin-bottom: 1.5rem;
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
  }
  
  &__actions {
    display: flex;
    justify-content: center;
    margin-top: 2rem;
  }
}

// Expired overlay
.timer-expired {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
  
  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 3rem;
    background: white;
    border-radius: 1rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    text-align: center;
    max-width: 90vw;
    animation: slideUp 0.3s ease;
  }
  
  &__title {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-error);
  }
  
  &__message {
    margin: 0;
    font-size: 1.125rem;
    color: var(--text-secondary);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

// Mobile responsiveness
@media (max-width: 768px) {
  .timer-main {
    padding: 1rem;
    gap: 1.5rem;
  }
  
  .timer-expired {
    &__content {
      padding: 2rem;
      margin: 1rem;
    }
    
    &__title {
      font-size: 1.5rem;
    }
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .timer-expired {
    animation: none;
    
    &__content {
      animation: none;
    }
  }
}
</style>