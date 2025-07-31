<template>
  <div :class="bemm()">
    <div :class="bemm('container')">
      <TIcon :name="Icons.QUESTION_MARK" size="xlarge" />
      <h1>{{ t('marketing.notfound.title') }}</h1>
      <p>{{ t('marketing.notfound.description') }}</p>
      <TButton 
        color="primary"
        @click="$router.push('/')"
        :icon="Icons.HOME"
      >
        {{ t('marketing.notfound.cta') }}
      </TButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { useI18n, TIcon, TButton } from '@tiko/ui'
import { Icons } from 'open-icon'

const bemm = useBemm('not-found-view')
const { t } = useI18n()
</script>

<style lang="scss">
.not-found-view {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;

  &__container {
    max-width: 600px;
    padding: var(--space);

    h1 {
      margin: var(--space) 0;
      color: var(--color-foreground);
    }

    p {
      color: var(--color-foreground-secondary);
      margin-bottom: var(--space-xl);
    }
  }
}
</style>