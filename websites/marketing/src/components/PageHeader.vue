<template>
  <div :class="bemm()">
    <router-link to="/">
      <TLogo :class="bemm('logo')" size="medium" />
    </router-link>
   <Navigation :class="bemm('nav')" />
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import { TLogo } from '@tiko/ui';
import Navigation from './Navigation.vue';

const bemm = useBemm('page-header');
</script>

<style lang="scss">
.page-header {
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-l);
  width: 100%;
  z-index: 15;

  &__logo {
    height: calc(var(--space-l) * 2);
    svg {
      height: 100%;
    }
  }

  @media screen and (max-width:720px){
    padding: var(--space-s);
  }

}
</style>
