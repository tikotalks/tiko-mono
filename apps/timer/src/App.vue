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
        :aria-label="t(keys.timer.start)"
      />
      <TButton
        v-else
        icon="pause"
        type="icon-only"
        color="success"
        size="medium"
        @click="pause"
        :aria-label="t(keys.timer.pause)"
      />

      <TButton
        icon="arrow-rotate-top-left"
        type="icon-only"
        size="medium"
        @click="reset"
        :aria-label="t(keys.timer.reset)"
      />

      <!-- Edit Timer Button -->
      <TButton
        icon="edit"
        type="icon-only"
        size="medium"
        @click="showEditSettings"
        :aria-label="t(keys.settings.title)"
      />

      <!-- Mode Toggle -->
      <TButton
        :icon="mode === 'up' ? 'arrow-up' : 'arrow-down'"
        type="icon-only"
        size="medium"
        @click="toggleMode"
        :aria-label="mode === 'up' ? t(keys.timer.countDown) : t(keys.timer.countUp)"
      />
    </template>

    <router-view />
  </TFramework>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { TFramework, TButton, type FrameworkConfig, popupService as importedPopupService, useI18n } from '@tiko/ui'
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

// i18n
const { t, keys } = useI18n()

// Local state for time settings
const minutes = ref(5)
const seconds = ref(0)
const loading = ref(false)

// Framework configuration
// Try to inject popup service, fallback to imported one
const injectedPopupService = inject<any>('popupService', null)
const popupService = injectedPopupService || importedPopupService

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
        title: t(keys.settings.title),
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
  if (popupService) {
    popupService.open({
      component: TimerSettingsForm,
      title: t(keys.settings.title),
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
  } else {
    console.error('PopupService not available')
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
