<template>
  <TAuthWrapper title="Timer" :backgroundImage="backgroundImage">
    <TAppLayout
      title="Timer"
      :show-header="true"
      @profile="handleProfile"
      @settings="handleAppSettings"
      @logout="handleLogout"
    >
    <template #top-bar-actions>
      <!-- Timer Controls -->
      <TButton
        v-if="!isRunning"
        icon="play"
        type="icon-only"
        size="medium"
        @click="start"
        :aria-label="'Start timer'"
      >
        Start
      </TButton>
      <TButton
        v-else
        icon="pause"
        type="icon-only"
        color="success"
        size="medium"
        @click="pause"
        :aria-label="'Pause timer'"
      >
        Pause
      </TButton>

      <TButton
        icon="arrow-rotate-top-left"
        type="icon-only"
        size="medium"
        @click="reset"
        :aria-label="'Reset timer'"
      >
        Reset
      </TButton>

      <!-- Edit Timer Button -->
      <TButton
        icon="edit"
        type="icon-only"
        size="medium"
        @click="showEditSettings"
        :aria-label="'Edit timer settings'"
      >
        Edit
      </TButton>

      <!-- Mode Toggle -->
      <TButton
        :icon="mode === 'up' ? 'arrow-up' : 'arrow-down'"
        type="icon-only"
        size="medium"
        @click="toggleMode"
        :aria-label="`Switch to ${mode === 'up' ? 'countdown' : 'count up'} mode`"
      />
    </template>

    <div :class="bemm()">
      <!-- Main Timer Display -->
      <main :class="bemm('main')">
        <!-- Timer Display -->
         <TimeDisplay
          :displayTime="formattedTime"
          :progress="progress"
          :mode="mode"
          :isExpired="isExpired"
          :isRunning="isRunning"
          :class="bemm('display')"
         ></TimeDisplay>
        <!-- <div :class="bemm('display')">
          <div :class="bemm('time')">{{ formattedTime }}</div>
          <div v-if="mode === 'down'" :class="bemm('progress')">
            <div
              :class="bemm('progress-bar')"
              :style="{ width: `${progress}%` }"
            />
          </div>
        </div> -->

        <!-- Controls moved to top bar -->
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
  </TAuthWrapper>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useBemm } from 'bemm'
import { TButton, TIcon, TAppLayout, TAuthWrapper, popupService } from '@tiko/ui'
import { useTimer } from '../composables/useTimer'
import TimerSettingsForm from '../components/TimerSettingsForm.vue'
import TimeDisplay from '../components/TimeDisplay.vue'
// import backgroundVideoUrl from '../assets/login-background.mp4'
import backgroundImage from '../assets/app-icon-timer.png'

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
  popupService.showPopup({
    component: TimerSettingsForm,
    title: 'Edit Timer Settings',
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
        popupService.closePopup()
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

  // Controls moved to top bar


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
