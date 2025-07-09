<template>
  <div id="app">
    <TAuthWrapper :title="'Radio'" :backgroundImage="backgroundImage">
      <RadioView />
    </TAuthWrapper>
    <TPopup />
  </div>
</template>

<script setup lang="ts">
import { TAuthWrapper, TPopup } from '@tiko/ui'
import RadioView from './views/RadioView.vue'
import backgroundImage from "./assets/app-icon-radio.png"

</script>

<style lang="scss">
@use '@tiko/ui/styles/app.scss';
#app {
  min-height: 100vh;
  font-family: var(--font-family-default);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  --color-primary: var(--color-yellow);
  --color-primary-text: var(--color-yellow-text);
  --color-secondary: var(--color-blue);
  --color-secondary-text: var(--color-blue-text);
}
</style>
