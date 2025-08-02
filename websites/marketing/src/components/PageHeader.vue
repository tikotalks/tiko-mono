<template>
  <div :class="bemm()">
    <router-link to="/">
      <Logo :class="bemm('logo')" />
      <!-- <TTikoLogo /> -->
    </router-link>
    <nav :class="bemm('nav')">
      <router-link to="/about" :class="bemm('nav-link')">About</router-link>
      <router-link to="/apps" :class="bemm('nav-link')">Apps</router-link>
      <router-link to="/sponsors" :class="bemm('nav-link')"
        >Sponsors</router-link
      >
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import Logo from './Logo.vue';
import { TTikoLogo } from '@tiko/ui';

const bemm = useBemm('page-header');
</script>

<style lang="scss">
.page-header {
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space);
  border-bottom: 1px solid var(--color-border);
  padding: var(--space-l);
  width: 100%;
  z-index: 15;

  &__logo {
    height: calc(var(--space-l) * 2);
    svg {
      height: 100%;
    }
  }
  &__nav {
    padding: var(--space);
    display: flex;
    gap: var(--space);
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: calc(var(--border-radius) + var(--space));
  }
  &__nav-link {
    background-color: color-mix(in srgb, var(--color-light), transparent 100%);
    padding: var(--space-xs) var(--space);
    border-radius: var(--border-radius);
    transition: background-color 0.3s ease;
    color: var(--color-light);
    &:hover {
      background-color: color-mix(
        in srgb,
        var(--color-primary),
        transparent 0%
      );
      color: var(--color-light);
    }
  }
}
</style>
