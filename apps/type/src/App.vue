<template>
  <TFramework 
    :config="frameworkConfig" 
    :loading="loading"
  >
    <router-view />
  </TFramework>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { TFramework, type FrameworkConfig, useI18n } from '@tiko/ui'
import tikoConfig from '../tiko.config'

const loading = ref(false)
const { t, keys } = useI18n()

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
        id: 'type-settings',
        title: t(keys.type.typeGameSettings),
        icon: 'keyboard',
        order: 10
        // component: TypeSettings // Add custom settings component if needed
      }
    ]
  }
}))
</script>

<style lang="scss">
@use '@tiko/ui/styles/app.scss';
</style>
