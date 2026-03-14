<template>
  <TFramework :config="frameworkConfig" :loading="loading" @settings-change="handleSettingsChange">
    <router-view />
  </TFramework>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted } from 'vue'
  import { useI18n } from '@tiko/core'
  import { TFramework, type FrameworkConfig } from '@tiko/ui'
  import tikoConfig from '../tiko.config'
  import { initializeTranslations } from '@tiko/core'
  import { useTypeStore, type TypeSettings } from './stores/type'
  import { TypeKeyboardSettingsSection } from './components/TypeKeyboardSettingsSection'

  const loading = ref(true)
  const { t, keys } = useI18n()
  const typeStore = useTypeStore()

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
      showCurrentRoute: false,
    },
    settings: {
      enabled: true,
      sections: [
        {
          id: 'type-settings',
          title: t(keys.value?.type?.typeGameSettings ?? 'type.typeGameSettings'),
          icon: 'keyboard',
          order: 10,
          component: TypeKeyboardSettingsSection,
        },
      ],
    },
  }))

  const handleSettingsChange = async (section: string, value: unknown) => {
    if (section !== 'type-settings' || !value || typeof value !== 'object') {
      return
    }

    await typeStore.updateSettings(value as Partial<TypeSettings>)
  }
</script>

<style lang="scss">
  @use '@tiko/ui/styles/app.scss';
</style>
