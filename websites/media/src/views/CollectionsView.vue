<template>
  <div :class="bemm()">
    <div :class="bemm('header')">
      <h1 :class="bemm('title')">{{ t('media.collections.title') }}</h1>
      <p :class="bemm('description')">{{ t('media.collections.description') }}</p>
    </div>
    
    <div :class="bemm('content')">
      <TEmptyState
        :icon="Icons.FOLDER"
        :title="t('media.collections.comingSoon')"
        :description="t('media.collections.comingSoonDescription')"
      >
        <TButton @click="router.push('/library')">
          {{ t('media.collections.browseLibrary') }}
        </TButton>
      </TEmptyState>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import {
  useI18n,
  TEmptyState,
  TButton
} from '@tiko/ui'

const bemm = useBemm('collections-view')
const { t } = useI18n()
const router = useRouter()
</script>

<style lang="scss">
.collections-view {
  padding: var(--space-lg);
  max-width: var(--max-width);
  margin: 0 auto;
  
  &__header {
    margin-bottom: var(--space-xl);
  }
  
  &__title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    margin: 0 0 var(--space-s) 0;
  }
  
  &__description {
    color: var(--color-foreground-secondary);
    margin: 0;
  }
  
  &__content {
    padding: var(--space-2xl);
  }
}
</style>