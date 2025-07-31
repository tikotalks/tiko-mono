<template>
  <div :class="bemm()">
    <div :class="bemm('container')">
      <h1>{{ t('marketing.privacy.title') }}</h1>
      <div :class="bemm('content')">
        <p>{{ t('marketing.privacy.intro') }}</p>
        <h2>{{ t('marketing.privacy.collection.title') }}</h2>
        <p>{{ t('marketing.privacy.collection.description') }}</p>
        <h2>{{ t('marketing.privacy.usage.title') }}</h2>
        <p>{{ t('marketing.privacy.usage.description') }}</p>
        <h2>{{ t('marketing.privacy.protection.title') }}</h2>
        <p>{{ t('marketing.privacy.protection.description') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { useI18n } from '@tiko/ui'

const bemm = useBemm('privacy-view')
const { t } = useI18n()
</script>

<style lang="scss">
.privacy-view {
  padding: var(--space-2xl) 0;
  min-height: 80vh;

  &__container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 var(--space);
  }

  &__content {
    margin-top: var(--space-xl);
    
    h2 {
      margin: var(--space-xl) 0 var(--space);
      color: var(--color-foreground);
    }

    p {
      color: var(--color-foreground-secondary);
      line-height: 1.8;
      margin-bottom: var(--space);
    }
  }
}
</style>