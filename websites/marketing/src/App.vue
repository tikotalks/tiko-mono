<template>
  <router-view v-if="isAuthCallbackRoute" />
  <TFramework
    :config="frameworkConfig"
    :require-auth="false"
    :show-splash-screen="false"
    :is-app="false"
  >
  <PageHeader/>
    <router-view />
    <PageFooter />
  </TFramework>
</template>

<script setup lang="ts">
import { TFramework, type FrameworkConfig } from '@tiko/ui'
import { useRoute } from 'vue-router'
import PageHeader from './components/PageHeader.vue';
import PageFooter from './components/PageFooter.vue';
import { usePrefetch } from './composables/usePrefetch';
import tikoConfig from '../tiko.config';
import { computed } from 'vue';

const route = useRoute()

// Initialize prefetch hints for better performance
usePrefetch();

// Check if current route is auth callback
const isAuthCallbackRoute = computed(() => {
  return route.path === '/auth/callback'
})

const frameworkConfig: FrameworkConfig = {
  ...tikoConfig,
  isApp: false,
  topBar: {
    showUser: false,
    showTitle: false,
    showSubtitle: false,
    showCurrentRoute: false
  },
  settings: {
    enabled: false
  }
}
</script>
