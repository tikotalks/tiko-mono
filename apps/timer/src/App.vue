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
        :aria-label="t('timer.start')"
      />
      <TButton
        v-else
        icon="pause"
        type="outline"
        color="success"
        size="medium"
        @click="pause"
        :aria-label="t('timer.pause')"
        :tooltip="t('timer.pause')"
        :tooltipSettings="{delay: .5, position: ToolTipPosition.BOTTOM}"
      />

      <TButton
        icon="arrow-rotate-top-left"
        type="outline"
        size="medium"
        @click="reset"
        :aria-label="t('timer.reset')"
        :tooltip="t('timer.reset')"
        :tooltipSettings="{delay: .5, position: ToolTipPosition.BOTTOM}"
      />

      <!-- Edit Timer Button -->
      <TButton
        icon="edit"
        type="outline"
        size="medium"
        @click="showEditSettings"
        :aria-label="t('common.settings')"
        :tooltip="t('common.settings')"
        :tooltipSettings="{delay: .5, position: ToolTipPosition.BOTTOM}"
      />

      <!-- Mode Toggle -->
      <TButton
        :icon="mode === 'up' ? 'arrow-up' : 'arrow-down'"
        type="outline"
        size="medium"
        @click="toggleMode"
        :aria-label="mode === 'up' ? t('timer.countDown') : t('timer.countUp')"
        :tooltip="mode === 'up' ? t('timer.countDown') : t('timer.countUp')"
        :tooltipSettings="{delay: .5, position: ToolTipPosition.BOTTOM}"
      />
    </template>

    <router-view />
  </TFramework>
</template>

<script setup lang="ts">
import { computed, inject, ref, onMounted } from 'vue'
import { TFramework, TButton, type FrameworkConfig, popupService as importedPopupService, ToolTipPosition} from '@tiko/ui'
import { useTimer } from './composables/useTimer'
import { useTimerStore } from './stores/timer'
import TimerSettingsForm from './components/TimerSettingsForm.vue'
import tikoConfig from '../tiko.config'
import backgroundImage from './assets/app-icon-timer.png'
import { initializeTranslations, useI18n } from '@tiko/core'

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
const { t } = useI18n()

// Get timer store
const timerStore = useTimerStore()

// Local state for time settings
const minutes = ref(5)
const seconds = ref(0)
const loading = ref(true)

// Initialize translations on mount
onMounted(async () => {
  await initializeTranslations()
  // Load timer state
  await timerStore.loadState()
  loading.value = false
})

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
        title: t('common.settings'),
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
  console.log('showEditSettings called, popupService:', popupService)
  if (popupService) {
    console.log('Opening popup with popupService.open')
    const result = popupService.open({
      component: TimerSettingsForm,
      title: t('common.settings'),
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
    console.log('Popup open result:', result)
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
