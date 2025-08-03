<template>
  <TFramework
    :config="frameworkConfig"
    :background-image="backgroundImage"
    :loading="loading"
  >
    <router-view />
  </TFramework>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { TFramework, type FrameworkConfig, useI18n } from '@tiko/ui'
import tikoConfig from '../tiko.config'
import backgroundImage from './assets/app-icon-tiko.png'
import { initializeTranslations } from './services/translation-init.service'

const { t, keys } = useI18n()
const loading = ref(true)
const router = useRouter()
const route = useRoute()

// Handle deep links and initialize translations
onMounted(async () => {
  // Initialize translations first
  await initializeTranslations()
  loading.value = false
  // Check if we're coming from a deep link
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
    window.Capacitor.Plugins.App.addListener('appUrlOpen', (data: any) => {
      const url = new URL(data.url)
      
      // Handle tiko://signin deep link
      if (url.protocol === 'tiko:' && url.pathname === '//signin') {
        const returnTo = url.searchParams.get('return_to')
        const appId = url.searchParams.get('app_id')
        const appName = url.searchParams.get('app_name')
        
        // Navigate to signin page with params
        router.push({
          name: 'signin',
          query: {
            return_to: returnTo,
            app_id: appId,
            app_name: appName,
            from_app: 'true'
          }
        })
      }
    })
  }
  
  // Also check if we're already on a deep link URL
  if (route.query.from_app === 'true' && route.name !== 'signin') {
    // Handle any initial deep link navigation
  }
})

// Framework configuration
const frameworkConfig = computed<FrameworkConfig>(() => ({
  ...tikoConfig,
  topBar: {
    showUser: true,
    showTitle: true,
    showSubtitle: false,
    showCurrentRoute: false,
    routeDisplay: 'subtitle',
    showBack: false
  },
  settings: {
    enabled: true,
    sections: [
      {
        id: 'tiko-settings',
        title: t(keys.settings.title),
        icon: 'settings',
        order: 10
      }
    ]
  }
}))
</script>

<style lang="scss">
@use '@tiko/ui/styles/app.scss';
</style>
