<template>
  <div id="app">
    <TAuthWrapper>
      <TypeView />
    </TAuthWrapper>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@tiko/core'
import { TAuthWrapper } from '@tiko/ui'
import TypeView from './views/TypeView.vue'

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
}
</style>