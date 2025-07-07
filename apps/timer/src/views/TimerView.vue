<template>
  <TAppLayout
    title="Timer"
    subtitle="Simple timer and stopwatch"
    @profile="handleProfile"
    @settings="handleAppSettings"
    @logout="handleLogout"
  >
    <template #top-bar-actions>
      <TButton
        :icon="mode === 'up' ? 'arrow-up' : 'arrow-down'"
        type="ghost"
        size="medium"
        color="secondary"
        @click="toggleMode"
        :aria-label="`Switch to ${mode === 'up' ? 'countdown' : 'count up'} mode`"
      />
    </template>

    <div :class="bemm()">
      <!-- Main Timer Display -->
      <main :class="bemm('main')">
        <!-- Timer Display -->
        <div :class="bemm('display')">
          <div :class="bemm('time')">{{ formattedTime }}</div>
          <div v-if="mode === 'down'" :class="bemm('progress')">
            <div 
              :class="bemm('progress-bar')" 
              :style="{ width: `${progress}%` }"
            />
          </div>
        </div>

        <!-- Controls -->
        <div :class="bemm('controls')">
          <TButton
            v-if="!isRunning"
            label="Start"
            icon="play"
            type="fancy"
            color="success"
            size="large"
            @click="start"
          />
          <TButton
            v-else
            label="Pause"
            icon="pause"
            type="fancy"
            color="warning"
            size="large"
            @click="pause"
          />
          
          <TButton
            label="Reset"
            icon="rotate-ccw"
            type="default"
            color="secondary"
            size="large"
            @click="reset"
          />
        </div>

        <!-- Edit Button -->
        <TButton
          label="Edit Timer"
          icon="edit"
          type="ghost"
          color="secondary"
          size="medium"
          @click="showSettings = true"
          :class="bemm('edit-button')"
        />
      </main>
    </div>

    <!-- Settings Modal -->
    <div v-if="showSettings" :class="bemm('settings')">
      <div :class="bemm('settings-backdrop')" @click="showSettings = false" />
      <div :class="bemm('settings-panel')">
        <h3 :class="bemm('settings-title')">Timer Settings</h3>

        <!-- Timer Duration (countdown only) -->
        <div v-if="mode === 'down'" :class="bemm('settings-group')">
          <label :class="bemm('settings-label')">Timer Duration</label>
          <div :class="bemm('time-inputs')">
            <input
              v-model.number="minutes"
              type="number"
              min="0"
              max="99"
              :class="bemm('time-input')"
              placeholder="MM"
            />
            <span>:</span>
            <input
              v-model.number="seconds"
              type="number"
              min="0"
              max="59"
              :class="bemm('time-input')"
              placeholder="SS"
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
        <div :class="bemm('settings-group')">
          <label :class="bemm('settings-checkbox')">
            <input
              v-model="localSettings.soundEnabled"
              type="checkbox"
              @change="updateSettings({ soundEnabled: localSettings.soundEnabled })"
            />
            <span>Sound notification</span>
          </label>
        </div>

        <div :class="bemm('settings-group')">
          <label :class="bemm('settings-checkbox')">
            <input
              v-model="localSettings.vibrationEnabled"
              type="checkbox"
              @change="updateSettings({ vibrationEnabled: localSettings.vibrationEnabled })"
            />
            <span>Vibration notification</span>
          </label>
        </div>

        <div :class="bemm('settings-actions')">
          <TButton
            label="Apply"
            type="fancy"
            color="primary"
            @click="applyTimeSettings"
            size="medium"
          />
          <TButton
            label="Close"
            type="default"
            color="secondary"
            @click="showSettings = false"
            size="medium"
          />
        </div>
      </div>
    </div>

    <!-- Expired Overlay -->
    <div v-if="isExpired" :class="bemm('expired')">
      <div :class="bemm('expired-content')">
        <TIcon name="clock" size="4rem" />
        <h2 :class="bemm('expired-title')">Time's Up!</h2>
        <TButton
          label="Dismiss"
          type="fancy"
          color="primary"
          @click="reset"
          size="large"
        />
      </div>
    </div>
  </TAppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useBemm } from 'bemm'
import { TButton, TIcon, TAppLayout } from '@tiko/ui'
import { useTimer } from '../composables/useTimer'

const bemm = useBemm('timer-view')
const {
  mode,
  isRunning,
  isExpired,
  settings,
  formattedTime,
  progress,
  start,
  pause,
  reset,
  setTime,
  toggleMode,
  updateSettings
} = useTimer()

// Local state
const showSettings = ref(false)
const minutes = ref(5)
const seconds = ref(0)

// Local settings copy for immediate UI updates
const localSettings = reactive({
  soundEnabled: true,
  vibrationEnabled: true
})

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
  minutes.value = presetMinutes
  seconds.value = presetSeconds
}

const applyTimeSettings = () => {
  setTime(minutes.value, seconds.value)
  showSettings.value = false
}

const handleProfile = () => {
  console.log('Profile clicked')
}

const handleAppSettings = () => {
  console.log('App settings clicked')
  showSettings.value = true
}

const handleLogout = () => {
  console.log('User logged out')
}

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (event.target && (event.target as HTMLElement).tagName === 'INPUT') {
    return
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
    case 'm':
      event.preventDefault()
      toggleMode()
      break
  }
}

// Watch settings
const syncSettings = () => {
  Object.assign(localSettings, settings.value)
}

// Lifecycle
onMounted(() => {
  syncSettings()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
.timer-view {
  &__main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 70vh;
    padding: 2rem;
    gap: 2rem;
  }

  &__display {
    text-align: center;
    margin-bottom: 2rem;
  }

  &__time {
    font-size: 4rem;
    font-weight: 700;
    color: var(--color-primary-text);
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
    letter-spacing: -0.02em;
    margin-bottom: 1rem;
  }

  &__progress {
    width: 200px;
    height: 8px;
    background: var(--color-border);
    border-radius: 4px;
    overflow: hidden;
    margin: 0 auto;
  }

  &__progress-bar {
    height: 100%;
    background: var(--color-primary);
    transition: width 1s linear;
    border-radius: 4px;
  }

  &__controls {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  &__edit-button {
    margin-top: 1rem;
  }

  &__settings {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;

    &-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
    }

    &-panel {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      min-width: 320px;
      max-width: 90vw;
      max-height: 90vh;
      overflow-y: auto;
    }

    &-title {
      margin: 0 0 1.5rem;
      font-size: 1.25rem;
      font-weight: 600;
      text-align: center;
    }

    &-group {
      margin-bottom: 1.5rem;
    }

    &-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--color-primary-text);
    }

    &-checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;

      input {
        width: 1.25rem;
        height: 1.25rem;
      }
    }

    &-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 2rem;
    }
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

  &__expired {
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

    &-content {
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

    &-title {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-error);
    }
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

// Mobile responsiveness
@media (max-width: 768px) {
  .timer-view {
    &__main {
      padding: 1rem;
      gap: 1.5rem;
    }

    &__time {
      font-size: 3rem;
    }

    &__controls {
      flex-direction: column;
      width: 100%;
      max-width: 300px;
    }

    &__settings {
      &-panel {
        padding: 1.5rem;
        margin: 1rem;
        min-width: auto;
      }

      &-actions {
        flex-direction: column;
      }
    }

    &__expired {
      &-content {
        padding: 2rem;
        margin: 1rem;
      }

      &-title {
        font-size: 1.5rem;
      }
    }
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .timer-view__expired {
    animation: none;

    &-content {
      animation: none;
    }
  }
}
</style>