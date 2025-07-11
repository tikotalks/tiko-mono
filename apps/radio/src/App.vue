<template>
  <TFramework 
    :config="frameworkConfig" 
    :background-image="backgroundImage"
    :loading="loading"
    @search="handleSearch"
  >
    <template #topbar-actions>
      <!-- Add Item Button (Parent Mode only) -->
      <TButton
        v-if="parentMode.canManageContent.value"
        type="default"
        color="primary"
        icon="plus"
        @click="handleAddClick"
      >
        Add Audio
      </TButton>

      <!-- Settings -->
      <TButton
        type="ghost"
        icon="settings"
        @click="handleSettingsClick"
      />
    </template>

    <router-view />
  </TFramework>
</template>

<script setup lang="ts">
import { computed, ref, inject } from 'vue'
import { TFramework, TButton, type FrameworkConfig, useParentMode, useEventBus } from '@tiko/ui'
import tikoConfig from '../tiko.config'
import backgroundImage from './assets/app-icon-radio.png'

// Loading state (radio app manages loading in components)
const loading = ref(false)

// Parent mode for radio app
const parentMode = useParentMode('radio')

// Event bus for communication with RadioView
const eventBus = useEventBus()

// Get injected services (will be available after TFramework mounts)
let popupService: any
let toastService: any

// Handle search from topbar
const handleSearch = (query: string) => {
  eventBus.emit('radio:search', { query })
}

// Handle add button click
const handleAddClick = () => {
  eventBus.emit('radio:add-item')
}

// Handle settings button click
const handleSettingsClick = () => {
  eventBus.emit('radio:show-settings')
}

// Framework configuration
const frameworkConfig = computed<FrameworkConfig>(() => ({
  ...tikoConfig,
  topBar: {
    showUser: true,
    showTitle: true,
    showSubtitle: false,
    showSearch: true,
    searchPlaceholder: 'Search audio...'
  },
  settings: {
    enabled: true,
    sections: [
      {
        id: 'radio-settings',
        title: 'Radio Settings',
        icon: 'music',
        order: 10
      }
    ]
  }
}))
</script>

<style lang="scss">
@use '@tiko/ui/styles/app.scss';
</style>
