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
import { TFramework, type FrameworkConfig  } from '@tiko/ui';
import {  computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { } from '@tiko/ui';
import tikoConfig from '../tiko.config';

const route = useRoute();
const loading = ref(false)

// Check if current route is auth callback
const isAuthCallbackRoute = computed(() => {
  return route?.path === '/auth/callback'
})


// Framework configuration
const frameworkConfig = computed<FrameworkConfig>(() => ({
  ...tikoConfig,
  topBar: {
    showUser: true,
    showTitle: true,
    showSubtitle: false,
    showCurrentRoute: false,
  },
  settings: {
    enabled: true,
    sections: [
    ],
  },
}));


</script>

<style lang="scss">
@use '@tiko/ui/styles/app.scss';
</style>