<template>
  <div id="app">
    <TAuthWrapper  :backgroundVideo="backgroundVideoUrl" :title="'Timer'">
      <TimerView />
    </TAuthWrapper>
  </div>
  <TPopup></TPopup>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@tiko/core'
import { TAuthWrapper, TPopup } from '@tiko/ui'
import TimerView from './views/TimerView.vue'
import backgroundVideoUrl from './assets/login-background.mp4'


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
