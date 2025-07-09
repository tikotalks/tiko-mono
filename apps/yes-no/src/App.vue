<template>
  <div id="app">
    <TAuthWrapper :backgroundImage="backgroundImage" :title="'Yes/No'">
      <YesNoView />
    </TAuthWrapper>
  </div>
  <TPopup />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAppStore } from '@tiko/core';
import { TAuthWrapper, TPopup } from '@tiko/ui';
import YesNoView from './views/YesNoView.vue';
import backgroundVideoUrl from './assets/login-background.mp4'
import backgroundImage from './assets/app-icon-yes-no.png';

const appStore = useAppStore();

onMounted(() => {
  // Initialize network monitoring
  appStore.initializeNetworkMonitoring();
});
</script>

<style lang="scss">
@use '@tiko/ui/styles/app.scss';

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;

  --color-primary: var(--color-purple);
  --color-secondary: var(--color-green);
  --color-tertiary: var(--color-red);
}
</style>
