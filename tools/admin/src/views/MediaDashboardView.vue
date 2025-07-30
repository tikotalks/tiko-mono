<template>
  <div :class="bemm()">


    <div :class="bemm('content')">
      <div :class="bemm('stats')">
        <TCard>
          <h3>{{ t('admin.dashboard.totalImages') }}</h3>
          <p class="stat-value">{{ stats.totalImages }}</p>
        </TCard>

        <TCard>
          <h3>{{ t('admin.dashboard.storageUsed') }}</h3>
          <p class="stat-value">{{ formatBytes(stats.storageUsed) }}</p>
        </TCard>

        <TCard>
          <h3>{{ t('admin.dashboard.lastUpload') }}</h3>
          <p class="stat-value">{{ stats.lastUpload ? formatDate(stats.lastUpload) : t('common.never') }}</p>
        </TCard>
      </div>

      <div :class="bemm('actions')">
        <TCard
          clickable
          @click="router.push('/upload')"
          :class="bemm('action-card')"
        >
          <TIcon :name="Icons.ARROW_UPLOAD" size="large" />
          <h3>{{ t('admin.dashboard.uploadImages') }}</h3>
          <p>{{ t('admin.dashboard.uploadDescription') }}</p>
        </TCard>

        <TCard
          clickable
          @click="router.push('/library')"
          :class="bemm('action-card')"
        >
          <TIcon :name="Icons.IMAGE" size="large" />
          <h3>{{ t('admin.dashboard.viewLibrary') }}</h3>
          <p>{{ t('admin.dashboard.libraryDescription') }}</p>
        </TCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { useI18n } from '@tiko/ui'
import { authService, useImages, formatBytes, formatDate } from '@tiko/core'
import {  TCard,  TIcon } from '@tiko/ui'
import { Icons } from 'open-icon'

const bemm = useBemm('dashboard-view')
const { t } = useI18n()
const router = useRouter()
const { stats, loadImages } = useImages()




onMounted(async () => {
  await loadImages()
})
</script>

<style lang="scss">
.dashboard-view {
  height: 100%;
  display: flex;
  flex-direction: column;

  &__content {
    flex: 1;
    padding: var(--space);
    overflow-y: auto;   display: flex;
     gap: var(--space);

  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--space);


    h3 {
      font-size: var(--font-size-s);
      color: var(--color-text-secondary);
      margin-bottom: var(--space-xs);
    }

    .stat-value {
      font-size: var(--font-size-2xl);
      font-weight: bold;
    }
  }

  &__actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--space);
  }

  &__action-card {
    text-align: center;
    padding: var(--space-l);
    transition: transform 0.2s;

    &:hover {
      transform: translateY(-2px);
    }

    h3 {
      margin: var(--space) 0 var(--space-xs);
    }

    p {
      color: var(--color-text-secondary);
      font-size: var(--font-size-s);
    }
  }
}</style>
