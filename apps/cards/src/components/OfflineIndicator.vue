<template>
  <Transition name="slide-down">
    <div v-if="isOffline" :class="bemm()">
      <TIcon :name="Icons.WIFI_NO" />
      <span>{{ t('common.offline') }}</span>
      <span v-if="hasOfflineData" :class="bemm('status')">
        {{ t('common.offlineDataAvailable') }}
      </span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBemm } from 'bemm'
import { TIcon, useI18n } from '@tiko/ui'
import { Icons } from 'open-icon'
import { useCardStore } from '../stores/cards'

const bemm = useBemm('offline-indicator')
const { t } = useI18n()
const cardStore = useCardStore()

const isOffline = computed(() => cardStore.isOffline)
const hasOfflineData = computed(() => cardStore.hasOfflineData)
</script>

<style lang="scss" scoped>
.offline-indicator {
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