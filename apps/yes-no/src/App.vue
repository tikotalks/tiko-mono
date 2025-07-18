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
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { TFramework, type FrameworkConfig } from '@tiko/ui'
import tikoConfig from '../tiko.config'
import backgroundImage from './assets/app-icon-yes-no.png'

const route = useRoute()
const loading = ref(false)

// Check if current route is auth callback
const isAuthCallbackRoute = computed(() => {
  return route.path === '/auth/callback'
})

// Make sure TAuthWrapper doesn't initialize on auth callback
if (isAuthCallbackRoute.value) {
  console.log('[App.vue] Auth callback route detected, skipping TAuthWrapper initialization')
}

// Debug app initialization
onMounted(() => {
  console.log('[App.vue] ========== APP MOUNTED ==========');
  console.log('[App.vue] tikoConfig:', tikoConfig);
  console.log('[App.vue] App ID:', tikoConfig.id);
  console.log('[App.vue] App Name:', tikoConfig.name);
  console.log('[App.vue] Background image:', backgroundImage);
  console.log('[App.vue] ========== END APP MOUNTED ==========');
})

// Framework configuration
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
        id: 'yes-no-settings',
        title: 'Yes/No Settings',
        icon: 'circle-question',
        order: 10
        // component: YesNoSettings // Add custom settings component if needed
      }
    ]
  }
}))
</script>

<style lang="scss">
@use '@tiko/ui/styles/app.scss';
</style>
