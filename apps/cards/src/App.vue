<template>
  <div id="app">
    <!-- Auth callback route doesn't need TFramework wrapper -->
    <router-view v-if="isAuthCallbackRoute" />

    <!-- All other routes use TFramework -->
    <TFramework
      v-else
      :config="frameworkConfig"
      :background-image="backgroundImage"
      :loading="loading"
    >
      <router-view />
    </TFramework>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { TFramework, type FrameworkConfig, useI18n } from '@tiko/ui'
import { useEventBus } from '@tiko/core'
import tikoConfig from '../tiko.config'
import backgroundImage from './assets/app-icon-yes-no.png'
import { initializeTranslations } from './services/translation-init.service'

const route = useRoute()
const loading = ref(true)
const { t, keys } = useI18n()
const eventBus = useEventBus()

// Global keyboard event handler
const handleGlobalKeyboard = (event: KeyboardEvent) => {
  // Emit the key event for popup components to listen to
  eventBus.emit('app:key', { key: event.key })
}

// Initialize translations on app startup
onMounted(async () => {
  try {
    await initializeTranslations()
  } catch (error) {
    console.error('Failed to initialize translations:', error)
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
  // Safely access the yesno settings key
  const cardsSettingsKey = keys.value?.cards?.cardsSettings || 'cards.cardsSettings'

  return {
    ...tikoConfig,
    auth: {
      ...tikoConfig.auth,
      skipAuth: true // Ensure skipAuth is explicitly set
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
