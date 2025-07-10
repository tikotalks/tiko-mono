<template>
  <div id="app" :style="themeStyles">
    <router-view />
  </div>
  <TPopup />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@tiko/core'
import { TPopup, useTikoConfig } from '@tiko/ui'
import tikoConfig from '../tiko.config'

const appStore = useAppStore()

// Set config and get theme styles
const { themeStyles } = useTikoConfig(tikoConfig)

onMounted(() => {
  // Initialize network monitoring
  appStore.initializeNetworkMonitoring()
})
</script>

<style lang="scss">
@use '@tiko/ui/styles/app.scss';

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
