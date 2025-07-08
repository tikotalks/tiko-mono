<template>
  <div id="app">
    <TAuthWrapper>
      <RadioView />
    </TAuthWrapper>
    <TPopup />
  </div>
</template>

<script setup lang="ts">
import { TAuthWrapper, TPopup } from '@tiko/ui'
import RadioView from './views/RadioView.vue'
</script>

<style lang="scss">
@use '@tiko/ui/styles/app.scss';
#app {
  min-height: 100vh;
  font-family: var(--font-family-default);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
