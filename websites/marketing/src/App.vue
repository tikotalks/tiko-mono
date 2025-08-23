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
      <PageHeader />
      <router-view />
    <PageFooter />
    </TFramework>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { TFramework, type FrameworkConfig, TOfflineIndicator } from '@tiko/ui'
import { useEventBus, useAppStore, useI18n, initializeTranslations } from '@tiko/core'
import tikoConfig from '../tiko.config'
import PageHeader from './components/PageHeader.vue'
import PageFooter from './components/PageFooter.vue'

const route = useRoute()
const loading = ref(true)
const { t } = useI18n({
  fallbackLocale: 'en-GB'
})
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

// Global keyboard event handler
const handleGlobalKeyboard = (event: KeyboardEvent) => {
  // Always emit the key event for popup components
  eventBus.emit('app:key', { key: event.key })

  // Check if the user is typing in an input, textarea, or contenteditable element
  const target = event.target as HTMLElement
  const isTyping = target.tagName === 'INPUT' ||
                   target.tagName === 'TEXTAREA' ||
                   target.tagName === 'SELECT' ||
                   target.contentEditable === 'true' ||
                   target.closest('[contenteditable="true"]')

  // Handle shortcuts based on context
  if (event.key === 'Escape' || event.key === 'e' || event.key === 's' || event.key === 'a') {
    // If user is typing in a form field, only allow Escape
    if (isTyping && event.key !== 'Escape') {
      return
    }

    // If a popup is open, only allow Escape
    if (isPopupOpen.value && event.key !== 'Escape') {
      return
    }

    // Prevent default behavior
    event.preventDefault()
    // Emit edit mode shortcut event
    eventBus.emit('app:editModeShortcut', { key: event.key })
  }
}

// Initialize translations on app startup
onMounted(async () => {
  try {
    await initializeTranslations()

    // Initialize network monitoring in the global app store
    const appStore = useAppStore()
    appStore.initializeNetworkMonitoring()


    const { currentLocale } = useI18n()

  } catch (error) {
    console.error('Failed to initialize app:', error)
  } finally {
    loading.value = false
  }

  // Set up global keyboard listener for popup shortcuts
  document.addEventListener('keydown', handleGlobalKeyboard)
})

// Cleanup keyboard listener
onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeyboard)
})

// Check if current route is auth callback
const isAuthCallbackRoute = computed(() => {
  return route.path === '/auth/callback'
})

// Framework configuration - use computed to ensure translations are reactive
const frameworkConfig = computed<FrameworkConfig>(() => {
  // Safely access the cards settings key
  const cardsSettingsKey =  'cards.cardsSettings'

  return {
    ...tikoConfig,
    auth: {
      ...tikoConfig.auth,
      skipAuth: true // Ensure skipAuth is explicitly set
    },
    isApp: false,
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
          id: 'cards-settings',
          title: t(cardsSettingsKey),
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
