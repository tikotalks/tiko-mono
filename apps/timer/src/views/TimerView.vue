<template>
  <TAppLayout
    title="Timer"
    subtitle="Simple timer and stopwatch"
    :show-header="true"
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
            icon="playback-play"
            type="default"
            color="success"
            size="large"
            @click="start"
          >
            Start
          </TButton>
          <TButton
            v-else
            icon="playback-pause"
            type="default"
            color="warning"
            size="large"
            @click="pause"
          >
            Pause
          </TButton>

          <TButton
            icon="arrow-rotate-top-left"
            type="outline"
            color="secondary"
            size="large"
            @click="reset"
          >
            Reset
          </TButton>
        </div>

        <!-- Edit Button -->
        <TButton
          icon="edit"
          type="ghost"
          color="secondary"
          size="medium"
          @click="showEditSettings"
          :class="bemm('edit-button')"
        >
          Edit Timer
        </TButton>
      </main>
    </div>


    <!-- Expired Overlay -->
    <div v-if="isExpired" :class="bemm('expired')">
      <div :class="bemm('expired-content')">
        <TIcon name="clock" size="4rem" />
        <h2 :class="bemm('expired-title')">Time's Up!</h2>
        <TButton
          type="default"
          color="primary"
          @click="reset"
          size="large"
        >
          Dismiss
        </TButton>
      </div>
    </div>
  </TAppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useBemm } from 'bemm'
import { TButton, TIcon, TAppLayout, popupService } from '@tiko/ui'
import { useTimer } from '../composables/useTimer'
import TimerSettingsForm from '../components/TimerSettingsForm.vue'

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

// Local state for time settings
const minutes = ref(5)
const seconds = ref(0)

const showEditSettings = () => {
  popupService.open({
    component: TimerSettingsForm,
    props: {
      mode: mode.value,
      minutes: minutes.value,
      seconds: seconds.value,
      settings: settings.value,
      onApply: (data: { minutes: number, seconds: number, settings: any }) => {
        setTime(data.minutes, data.seconds)
        updateSettings(data.settings)
        minutes.value = data.minutes
        seconds.value = data.seconds
        popupService.close()
      }
    }
  })
}

const handleProfile = () => {
  console.log('Profile clicked')
}

const handleAppSettings = () => {
  showEditSettings()
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

// Lifecycle
onMounted(() => {
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
    height: 100vh;
    gap: 2rem;
  }

  &__display {
    text-align: center;
    font-weight: bold;
    font-variant: tabular-nums;
  }

  &__time {
    font-size: 20vmax;
    color: var(--color-primary-text);
  }

  &__progress {
    width: 200px;
    height: 8px;
    background: var(--color-accent);
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
