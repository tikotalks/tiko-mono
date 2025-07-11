<template>
  <TFramework 
    :config="frameworkConfig" 
    :background-image="backgroundImage"
  >
    <template #topbar-actions>
      <TButton
        type="ghost"
        color="primary"
        size="small"
        icon="chevron-left"
        @click="$router.go(-1)"
        v-if="$route.name !== 'home'"
      >
        Back
      </TButton>
    </template>

    <router-view />
  </TFramework>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { TFramework, TButton, useI18n } from '@tiko/ui'
import tikoConfig from '../tiko.config'
import backgroundImage from './assets/ui-docs-icon.png'

const route = useRoute()
const { t, keys } = useI18n()

// Framework configuration
const frameworkConfig = computed(() => ({
  ...tikoConfig,
  topBar: {
    showUser: false,
    showTitle: true,
    showSubtitle: true,
    showCurrentRoute: true,
    routeDisplay: 'title',
    showBack: false
  },
  settings: {
    enabled: true,
    sections: [
      {
        id: 'ui-docs-settings',
        title: 'Documentation Settings',
        icon: 'code-brackets',
        order: 10
      }
    ]
  }
}))
</script>

<style lang="scss">
@use '@tiko/ui/styles/app.scss';
</style>
