<template>
  <div :class="bemm('',['', config?.isApp ? 'is-app' : 'is-website'])">
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
        <template #app-controls>
          <slot name="app-controls" />
        </template>

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
import { useBemm } from 'bemm';
import { TTopBar } from '../TTopBar';
import type { TAppLayoutProps, TAppLayoutEmits } from './TAppLayout.model';

withDefaults(defineProps<TAppLayoutProps>(), {
  showBackButton: false,
  backButtonLabel: 'Back',
  showUserInfo: true,
  showOnlineStatus: true,
  showHeader: true,
  isUserOnline: true,
  isLoading: false
});

defineEmits<TAppLayoutEmits>();

const bemm = useBemm('app-layout');
</script>

<style lang="scss" scoped>
.app-layout {
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  &__header {
    width: calc(100% - (var(--space) * 2));
    top: 0;
    position: sticky;
    z-index: 10;
    left: var(--space);
    border-radius: 0 0 var(--border-radius-s) var(--border-radius-s);
  }

  &--is-app {
    height: 100vh;
    overflow: auto;

    .app-layout__header {
      position: fixed;
    }
  }

  &--is-website {
    min-height: 100vh;
    justify-content: flex-start;
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
