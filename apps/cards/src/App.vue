<template>
  <div id="app">
    <TAuthWrapper title="Cards" :backgroundImage="backgroundImage">
      <CardsView />
    </TAuthWrapper>
  </div>
</template>

<script setup lang="ts">
import { TAuthWrapper } from '@tiko/ui'
import CardsView from './views/CardsView.vue'
import backgroundImage from './assets/app-icon-cards.png'
</script>

<style lang="scss">
@use '@tiko/ui/styles/app.scss';

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;

  --color-primary: var(--color-green);
  --color-primary-text: var(--color-green-text);
  --color-secondary: var(--color-blue);
  --color-secondary-text: var(--color-blue-text);
}
</style>
