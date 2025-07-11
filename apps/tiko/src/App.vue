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
import { computed, ref } from 'vue'
import { TFramework, type FrameworkConfig, useI18n } from '@tiko/ui'
import tikoConfig from '../tiko.config'
import backgroundImage from './assets/app-icon-tiko.png'

const { t, keys } = useI18n()
const loading = ref(false)

// Framework configuration
const frameworkConfig = computed<FrameworkConfig>(() => ({
  ...tikoConfig,
  topBar: {
    showUser: true,
    showTitle: true,
    showSubtitle: false,
    showCurrentRoute: false,
    routeDisplay: 'title',
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
