<template>
    <!-- Auth callback route doesn't need TFramework wrapper -->
    <router-view v-if="isAuthCallbackRoute" />
    <TFramework
      :config="frameworkConfig"
      :require-auth="false"
      :show-splash-screen="false"
      :loading="loading"
      :is-app="false"
    >
      <PageHeader />
      <router-view />
      <PageFooter />
    </TFramework>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { TFramework, type FrameworkConfig } from '@tiko/ui';
import tikoConfig from '../tiko.config';
import PageHeader from './components/PageHeader.vue';
import PageFooter from './components/PageFooter.vue';

// Check if development mode
const isDev = import.meta.env.DEV

const route = useRoute()
const loading = ref(false)

// Check if current route is auth callback
const isAuthCallbackRoute = computed(() => {
  return route.path === '/auth/callback'
})

const frameworkConfig: FrameworkConfig = {
  ...tikoConfig,
  topBar: {
    showUser: false,
    showTitle: false,
    showSubtitle: false,
    showCurrentRoute: false,
  },
  settings: {
    enabled: false,
  },
};
</script>
