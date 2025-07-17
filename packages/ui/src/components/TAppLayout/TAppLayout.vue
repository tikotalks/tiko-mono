<template>
  <div :class="bemm()">
    <!-- Top Bar -->
    <header :class="bemm('header')">
      <TTopBar
        v-if="showHeader"
        :title="title"
        :subtitle="subtitle"
        :show-back-button="showBackButton"
        :back-button-label="backButtonLabel"
        :show-user-info="showUserInfo"
        :show-online-status="showOnlineStatus"
        :is-user-online="isUserOnline"
        :is-loading="isLoading"
        :custom-menu-items="customMenuItems"
        :app-name="appName"
        @back="$emit('back')"
        @profile="$emit('profile')"
        @settings="$emit('settings')"
        @logout="$emit('logout')"
        @menu-item-click="$emit('menu-item-click', $event)"
      >
        <template #center>
          <slot name="top-bar-center" />
        </template>

        <template #actions>
          <slot name="top-bar-actions" />
        </template>
      </TTopBar>
    </header>

    <!-- Main Content -->
    <main :class="bemm('content')">
      <slot />
    </main>

    <!-- Footer (if needed) -->
    <footer v-if="$slots.footer" :class="bemm('footer')">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { TTopBar } from '../TTopBar'
import type { TAppLayoutProps, TAppLayoutEmits } from './TAppLayout.model'

const props = withDefaults(defineProps<TAppLayoutProps>(), {
  showBackButton: false,
  backButtonLabel: 'Back',
  showUserInfo: true,
  showOnlineStatus: false,
  showHeader: true,
  isUserOnline: true,
  isLoading: false
})

defineEmits<TAppLayoutEmits>()

const bemm = useBemm('app-layout');
</script>

<style lang="scss" scoped>
.app-layout {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: auto;

  &__header {
    width: calc(100% - (var(--space) * 2));
    top: 0;
    position: fixed;
    z-index: 10;
    left: var(--space);
    border-radius: 0 0 var(--border-radius-s) var(--border-radius-s);
  }

  &__content {
    width: 100%;
    position: relative;
    height: fit-content;

  }

  &__footer {
    flex-shrink: 0;
    border-top: 1px solid var(--color-border);
    background: var(--color-accent);
  }
}
</style>
