<template>
  <div :class="bemm()">
    <div :class="bemm('container')">
      <h1>{{ t('marketing.terms.title') }}</h1>
      <div :class="bemm('content')">
        <p>{{ t('marketing.terms.intro') }}</p>
        <h2>{{ t('marketing.terms.usage.title') }}</h2>
        <p>{{ t('marketing.terms.usage.description') }}</p>
        <h2>{{ t('marketing.terms.restrictions.title') }}</h2>
        <p>{{ t('marketing.terms.restrictions.description') }}</p>
        <h2>{{ t('marketing.terms.liability.title') }}</h2>
        <p>{{ t('marketing.terms.liability.description') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { useI18n } from '@tiko/ui'

const bemm = useBemm('terms-view')
const { t } = useI18n()
</script>

<style lang="scss">
.terms-view {
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