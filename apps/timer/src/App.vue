<template>
  <div id="app">
    <router-view />
  </div>
  <TPopup></TPopup>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@tiko/core'
import { TPopup } from '@tiko/ui'

const appStore = useAppStore()

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

  --color-primary: var(--color-orange);
  --color-primary-text: var(--color-orange-text);
  --color-secondary: var(--color-blue);
  --color-secondary-text: var(--color-blue-text);
}
</style>
