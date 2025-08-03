<template>
  <div :class="bemm()">
    <div v-if="loading" :class="bemm('loading')">
      <TIcon name="circular-loader" :size="16" />
    </div>
    <div v-else-if="buildInfo" :class="bemm('info')">
      <span :class="bemm('version')">{{ versionString }}</span>
      <span :class="bemm('deployment')">{{ deploymentString }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { TIcon, useBuildInfo } from '@tiko/ui'

const bemm = useBemm('deployment-version')
const { buildInfo, loading, versionString, deploymentString } = useBuildInfo()
</script>

<style lang="scss">
.deployment-version {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 0.875em;
  color: var(--color-foreground-secondary);

  &__info {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
  }

  &__version {
    font-weight: 500;
  }

  &__deployment {
    font-size: 0.85em;
    opacity: 0.7;
  }
}
</style>