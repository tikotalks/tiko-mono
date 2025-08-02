<template>
  <TFramework
    :config="frameworkConfig"
    :require-auth="false"
    :show-splash-screen="false"
    :is-app="false"
  >
  <PageHeader/>
    <router-view />
  </TFramework>
</template>

<script setup lang="ts">
import { TFramework, type FrameworkConfig } from '@tiko/ui'
import PageHeader from './components/PageHeader.vue';

const frameworkConfig: FrameworkConfig = {
  id: 'marketing',
  name: 'Tiko Marketing',
  isApp: false,
  theme: {
    primary: 'indigo'
  },
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
