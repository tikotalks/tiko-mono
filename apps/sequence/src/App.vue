<template>
  <div id="app">
    <!-- Offline indicator -->
    <TOfflineIndicator />

    <!-- Auth callback route doesn't need TFramework wrapper -->
    <router-view v-if="isAuthCallbackRoute" />

    <!-- All other routes use TFramework -->
    <TFramework
      v-else
      :config="frameworkConfig"
      :loading="loading"
      :pwa-register-sw="pwaRegisterSW"
    >
      <router-view />
    </TFramework>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { TFramework, type FrameworkConfig, useI18n, TOfflineIndicator } from '@tiko/ui'
import { useEventBus, useAppStore } from '@tiko/core'
import tikoConfig from '../tiko.config'
import { initializeTranslations } from './services/translation-init.service'

const route = useRoute()
const loading = ref(true)
const { t, keys } = useI18n()
const eventBus = useEventBus()

// PWA registration function - will be loaded lazily
const pwaRegisterSW = ref<any>(null)

// Track if any popup is open
const isPopupOpen = ref(false)

// Listen for popup state changes
eventBus.on('popup:opened', () => {
  isPopupOpen.value = true
})

eventBus.on('popup:closed', () => {
  isPopupOpen.value = false
})

// Initialize translations on app startup
onMounted(async () => {
  try {
    await initializeTranslations()

    // Pre-load all cards if enabled in settings
    const appStore = useAppStore()
    // const { currentLocale } = useI18n()

    // Initialize offline support
    await appStore.initializeOfflineSupport()


    // Load PWA registration function if available
    try {
      const { registerSW } = await import('virtual:pwa-register' as any)
      pwaRegisterSW.value = registerSW
    } catch (error) {
      console.log('PWA not configured for this environment')
    }
  } catch (error) {
    console.error('Failed to initialize app:', error)
  } finally {
    loading.value = false
  }

})


// Check if current route is auth callback
const isAuthCallbackRoute = computed(() => {
  return route?.path === '/auth/callback'
})

// Framework configuration - use computed to ensure translations are reactive
const frameworkConfig = computed<FrameworkConfig>(() => {
  // Safely access the cards settings key
  const sequenceSettingsKey = keys.value?.sequence?.sequenceSettings || 'sequence.sequenceSettings'

  return {
    ...tikoConfig,
    auth: {
      ...tikoConfig.auth,
      skipAuth: true
    },
    topBar: {
      showUser: true,
      showTitle: true,
      showSubtitle: false,
      showCurrentRoute: false
    },
    settings: {
      enabled: true,
      sections: [
        {
          id: 'sequence-settings',
          title: t(sequenceSettingsKey),
          icon: 'circle-question',
          order: 10
        }
      ]
    }
  }
});
</script>

<style lang="scss">
@use '@tiko/ui/styles/app.scss';
</style>
