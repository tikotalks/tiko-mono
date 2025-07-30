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
      :is-app="false"
    >
      <router-view />
    </TFramework>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { TFramework, type FrameworkConfig, useI18n } from '@tiko/ui'
import tikoConfig from '../tiko.config'
import { initializeTranslations } from './services/translation-init.service'
// import backgroundImage from './assets/app-icon-admin.png'
const backgroundImage = ''

const route = useRoute()
const loading = ref(true)
const { t, keys } = useI18n()

// Initialize translations on app startup
onMounted(async () => {
  try {
    await initializeTranslations()
  } catch (error) {
    console.error('Failed to initialize translations:', error)
  } finally {
    loading.value = false
  }
})

// Check if current route is auth callback
const isAuthCallbackRoute = computed(() => {
  return route.path === '/auth/callback'
})

// Framework configuration - use computed to ensure translations are reactive
const frameworkConfig = computed<FrameworkConfig>(() => ({
  ...tikoConfig,
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
        id: 'admin-settings',
        title: t(keys.common.settings),
        icon: 'settings',
        order: 10
      }
    ]
  }
}));
</script>

<style lang="scss">
@use '@tiko/ui/styles/app.scss';
</style>
