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
import { TFramework } from '@tiko/ui'
import type { TikoConfig } from '@tiko/core'
import tikoConfig from '../tiko.config'
// import backgroundImage from './assets/app-icon-admin.png'
const backgroundImage = ''

// Check if development mode
const isDev = import.meta.env.DEV

const route = useRoute()
const loading = ref(false)

// Check if current route is auth callback
const isAuthCallbackRoute = computed(() => {
  return route.path === '/auth/callback'
})

// Framework configuration - use translation keys
const frameworkConfig = {
  ...tikoConfig,
  topBar: {
    show: true  // Ensure topbar is shown
  }
};
</script>

<style lang="scss">
@use '@tiko/ui/styles/app.scss';

body{
  font-size: 16px;
}
</style>
