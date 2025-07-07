<template>
  <div id="app">
    <TAuthWrapper>
      <CardsView />
    </TAuthWrapper>
  </div>
</template>

<script setup lang="ts">
import { TAuthWrapper } from '@tiko/ui'
import CardsView from './views/CardsView.vue'
</script>

<style lang="scss">
@use '@tiko/ui/styles/app.scss';

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
