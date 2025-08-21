<template>
  <div :class="bemm()">
    <AdminPageHeader
      :title="t('admin.dashboard.mediaTitle')"
      :description="t('admin.dashboard.mediaDescription')"
    >
      <template #stats>
        <TKeyValue
          :items="[
            {
              key: t('admin.dashboard.totalImages'),
              value: String(stats.totalImages)
            },
            {
              key: t('admin.dashboard.storageUsed'),
              value: formatBytes(stats.storageUsed)
            },
            {
              key: t('admin.dashboard.lastUpload'),
              value: stats.lastUpload ? formatDate(stats.lastUpload) : t('common.never')
            }
          ]"
        />
      </template>
    </AdminPageHeader>

    <div :class="bemm('content')">

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
import { useI18n } from '@tiko/core'
import { authService, useImages, formatBytes, formatDate } from '@tiko/core'
import {  TCard,  TIcon, TKeyValue } from '@tiko/ui'
import { Icons } from 'open-icon'
import AdminPageHeader from '../components/AdminPageHeader.vue'

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
    overflow-y: auto;
    display: flex;
    gap: var(--space);
  }

  &__stat-value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-foreground);
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
