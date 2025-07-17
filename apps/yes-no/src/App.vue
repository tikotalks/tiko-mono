<template>
  <TFramework
    :config="frameworkConfig"
    :background-image="backgroundImage"
    :loading="loading"
  >
    <router-view />
  </TFramework>
  <TPopup />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { TFramework, type FrameworkConfig } from '@tiko/ui'
import tikoConfig from '../tiko.config'
import backgroundImage from './assets/app-icon-yes-no.png'
import {TPopup} from '@tiko/ui'

const loading = ref(false)

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
