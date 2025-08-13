<template>
  <div :class="bemm()">
    <router-link to="/" :class="bemm('logo-link')">
      <TLogo :class="bemm('logo')" size="medium" />
    </router-link>
    <TNavigation
      :items="navigationItems"
      :show-mobile-toggle="true"
      :show-logo="false"
      :class="bemm('nav')"
    />
    <TUserMenu v-if="authStore.user" :class="bemm('user-menu')" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBemm } from 'bemm'
import { TLogo, TNavigation, TUserMenu, type NavigationItem } from '@tiko/ui'
import { useAuthStore } from '@tiko/core'

const bemm = useBemm('page-header')
const authStore = useAuthStore()

// Static navigation for now
const navigationItems = ref<NavigationItem[]>([
  { id: '1', title: 'Library', path: '/library', order: 1 },
  { id: '2', title: 'Collections', path: '/collections', order: 2 },
  { id: '3', title: 'Categories', path: '/categories', order: 3 },
  { id: '4', title: 'About', path: '/about', order: 4 }
])
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
  top: 0;
  border-bottom: 1px solid var(--color-border);

  &__logo-link {
    display: flex;
    align-items: center;
  }

  &__logo {
    height: calc(var(--space-l) * 2);
    svg {
      height: 100%;
    }
  }

  &__nav {
    flex: 0;
    justify-content: center;
  }

  &__user-menu {
    margin-right: 0;

    @media screen and (max-width: 768px) {
      margin-right: var(--space-xl);
    }
  }
}
</style>
