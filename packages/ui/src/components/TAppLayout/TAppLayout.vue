<template>
  <div :class="bemm()">
    <!-- Top Bar -->
    <TTopBar
      :title="title"
      :subtitle="subtitle"
      :show-back-button="showBackButton"
      :back-button-label="backButtonLabel"
      :show-user-info="showUserInfo"
      :show-online-status="showOnlineStatus"
      :is-user-online="isUserOnline"
      :is-loading="isLoading"
      :custom-menu-items="customMenuItems"
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
import type { ContextMenuItem } from '../TContextMenu'

interface Props {
  title?: string
  subtitle?: string
  showBackButton?: boolean
  backButtonLabel?: string
  showUserInfo?: boolean
  showOnlineStatus?: boolean
  isUserOnline?: boolean
  isLoading?: boolean
  customMenuItems?: ContextMenuItem[]
}

interface Emits {
  (e: 'back'): void
  (e: 'profile'): void
  (e: 'settings'): void
  (e: 'logout'): void
  (e: 'menu-item-click', item: ContextMenuItem): void
}

defineProps<Props>()
defineEmits<Emits>()

const bemm = useBemm('app-layout')
</script>

<style lang="scss" scoped>
.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-background);

  &__content {
    flex: 1;
    overflow-y: auto;
    position: relative;
  }

  &__footer {
    flex-shrink: 0;
    border-top: 1px solid var(--color-border);
    background: var(--color-accent);
  }
}

</style>
