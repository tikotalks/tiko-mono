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
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { TFramework, type FrameworkConfig } from '@tiko/ui'
import tikoConfig from '../tiko.config'
// import backgroundImage from './assets/app-icon-admin.png'
const backgroundImage = ''

const route = useRoute()
const loading = ref(false)

// Check if current route is auth callback
const isAuthCallbackRoute = computed(() => {
  return route.path === '/auth/callback'
})

// Framework configuration - use translation keys
const frameworkConfig: FrameworkConfig = {
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
        title: 'common.settings', // Translation key - component will translate
        icon: 'settings',
        order: 10
      }
    ]
  }
};
</script>

<style lang="scss">
@use '@tiko/ui/styles/app.scss';
</style>
