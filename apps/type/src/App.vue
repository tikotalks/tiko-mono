<template>
  <TFramework 
    :config="frameworkConfig" 
    :loading="loading"
  >
    <router-view />
  </TFramework>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { TFramework, type FrameworkConfig, useI18n } from '@tiko/ui'
import tikoConfig from '../tiko.config'
import { initializeTranslations } from './services/translation-init.service'

const loading = ref(true)
const { t, keys } = useI18n()

// Initialize translations on mount
onMounted(async () => {
  await initializeTranslations()
  loading.value = false
})

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
