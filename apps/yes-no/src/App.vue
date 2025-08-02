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
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { TFramework, type FrameworkConfig, useI18n } from '@tiko/ui'
import tikoConfig from '../tiko.config'
import backgroundImage from './assets/app-icon-yes-no.png'

const route = useRoute()
const loading = ref(false)
const { t, keys } = useI18n()

// Check if current route is auth callback
const isAuthCallbackRoute = computed(() => {
  return route.path === '/auth/callback'
})

// Framework configuration
const frameworkConfig = ref<FrameworkConfig>({
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
        id: 'yes-no-settings',
        title: t(keys.yesno.yesnoSettings),
        icon: 'circle-question',
        order: 10
      }
    ]
  }
});
</script>

<style lang="scss">
@use '@tiko/ui/styles/app.scss';
</style>
