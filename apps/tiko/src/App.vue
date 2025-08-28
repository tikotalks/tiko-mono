<template>
  <div id="app">
    <!-- Auth callback route doesn't need TFramework wrapper -->
    <router-view v-if="isAuthCallbackRoute" />

    <!-- All other routes use TFramework -->
    <TFramework
      v-else
      :config="frameworkConfig"
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
import { useI18n } from '@tiko/core'

const route = useRoute()
const loading = ref(false)
const { t } = useI18n()

// Check if current route is auth callback
const isAuthCallbackRoute = computed(() => {
  return route.path === '/auth/callback'
})

// Framework configuration - use computed to ensure translations are reactive
const frameworkConfig = computed<FrameworkConfig>(() => {
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
          id: 'tiko-settings',
          title: t('tiko.yesnoSettings'),
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
