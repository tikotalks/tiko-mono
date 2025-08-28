<template>
  <div :class="bemm('',['', tikoConfig.isApp ? 'is-app' : 'is-website'])">
    <!-- Top Bar -->
    <header :class="bemm('header')">
      <TTopBar
        v-if="showTopBar"
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
        :show-user-menu="showUserMenu"
        :user-display-name="userDisplayName"
        :user-avatar="userAvatar"
        :user-initials="userInitials"
        :user-avatar-color="userAvatarColor"
        :user-role="userRole"
        :show-parent-mode-indicator="showParentModeIndicator"
        :enable-parent-mode="computedEnableParentMode"
        :is-app="tikoConfig.isApp"
        :config="tikoConfig"
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
import { computed } from 'vue';
import { useBemm } from 'bemm';
import TTopBar from '../TTopBar/TTopBar.vue';
import type { TAppLayoutProps, TAppLayoutEmits } from './TAppLayout.model';
import { useTikoConfig } from '@tiko/core';

const props = withDefaults(defineProps<TAppLayoutProps>(), {
  showBackButton: false,
  backButtonLabel: 'Back',
  showUserInfo: true,
  showOnlineStatus: true,
  showHeader: true,
  isUserOnline: true,
  isLoading: false,
  showUserMenu: true,
  showParentModeIndicator: false,
  enableParentMode: undefined
});

defineEmits<TAppLayoutEmits>();

const bemm = useBemm('app-layout');

const tikoConfig = computed(()=>{
  return useTikoConfig(props.config).config;
})

// Compute enableParentMode with proper default based on isApp
const computedEnableParentMode = computed(() => {
  if (props.enableParentMode !== undefined) {
    return props.enableParentMode;
  }
  // Default to true for apps, false for websites
  return props.config?.isApp ?? true;
});

const showTopBar = computed(()=>{
  if(props.config?.topBar){
    return props.config.topBar.show;
  } else {
    return true;
  }
})
</script>

<style lang="scss">
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
    height: 100dvh; /* Dynamic viewport height for iOS */
    overflow: auto;
    -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */

    .app-layout__header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
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
    border-top: 1px solid var(--color-accent);
    background: var(--color-accent);
  }
}
</style>
