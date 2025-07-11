<template>
  <TFramework 
    :config="frameworkConfig" 
    :background-image="backgroundImage"
    :loading="loading"
  >
    <template #topbar-actions>
      <!-- Timer Controls -->
      <TButton
        v-if="!isRunning"
        icon="play"
        type="icon-only"
        size="medium"
        @click="start"
        :aria-label="'Start timer'"
      />
      <TButton
        v-else
        icon="pause"
        type="icon-only"
        color="success"
        size="medium"
        @click="pause"
        :aria-label="'Pause timer'"
      />

      <TButton
        icon="arrow-rotate-top-left"
        type="icon-only"
        size="medium"
        @click="reset"
        :aria-label="'Reset timer'"
      />

      <!-- Edit Timer Button -->
      <TButton
        icon="edit"
        type="icon-only"
        size="medium"
        @click="showEditSettings"
        :aria-label="'Edit timer settings'"
      />

      <!-- Mode Toggle -->
      <TButton
        :icon="mode === 'up' ? 'arrow-up' : 'arrow-down'"
        type="icon-only"
        size="medium"
        @click="toggleMode"
        :aria-label="`Switch to ${mode === 'up' ? 'countdown' : 'count up'} mode`"
      />
    </template>

    <router-view />
  </TFramework>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { TFramework, TButton, type FrameworkConfig } from '@tiko/ui'
import { useTimer } from './composables/useTimer'
import TimerSettingsForm from './components/TimerSettingsForm.vue'
import tikoConfig from '../tiko.config'
import backgroundImage from './assets/app-icon-timer.png'

// Get timer state
const {
  mode,
  isRunning,
  formattedTime,
  settings,
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
const loading = ref(false)

// Framework configuration
const frameworkConfig = computed<FrameworkConfig>(() => ({
  ...tikoConfig,
  topBar: {
    showUser: true,
    showTitle: true,
    showSubtitle: true,
    showCurrentRoute: false,
    subtitle: formattedTime.value // Show timer in subtitle
  },
  settings: {
    enabled: true,
    sections: [
      {
        id: 'timer-settings',
        title: 'Timer Settings',
        icon: 'clock',
        order: 10,
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
          }
        }
      }
    ]
  }
}))

// Show timer settings
const showEditSettings = () => {
  const popupService = inject<any>('popupService')
  if (popupService) {
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
        },
        onClose: () => popupService.close()
      }
    })
  }
}
</script>

<style lang="scss">
@use '@tiko/ui/styles/app.scss';

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
