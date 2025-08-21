<template>
  <Transition name="slide-down">
    <div v-if="isOffline" :class="bemm()">
      <TIcon :name="Icons.WIFI" />
      <span>{{ props.message || t('common.offline') }}</span>
      <span v-if="hasPendingSync" :class="bemm('status')">
        {{ t('common.pendingSync') }}
      </span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBemm } from 'bemm'
import { TIcon } from '../../ui-elements/TIcon'
import { useI18n } from '@tiko/core';
import { Icons } from 'open-icon'
import { useAppStore } from '@tiko/core'
import type { TOfflineIndicatorProps } from './TOfflineIndicator.model'

const props = withDefaults(defineProps<TOfflineIndicatorProps>(), {
  offline: undefined,
  pendingSync: undefined,
  message: undefined
})

const bemm = useBemm('t-offline-indicator')
const { t } = useI18n()
const appStore = useAppStore()

const isOffline = computed(() => props.offline !== undefined ? props.offline : appStore.isOffline)
const hasPendingSync = computed(() => props.pendingSync !== undefined ? props.pendingSync : appStore.hasPendingSync)
</script>

<style lang="scss" scoped>
.t-offline-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: var(--color-warning);
  color: var(--color-warning-foreground);
  padding: var(--space-2) var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  justify-content: center;
  font-size: var(--font-size-small);
  z-index: 9999;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &__status {
    opacity: 0.8;
    font-size: var(--font-size-xs);
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
}
</style>
