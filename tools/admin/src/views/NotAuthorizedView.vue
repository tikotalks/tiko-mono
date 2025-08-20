<template>
  <div :class="bemm()">
    <TCard :class="bemm('card')">
      <TIcon :name="Icons.LOCK" size="xlarge" :class="bemm('icon')" />
      <h1 :class="bemm('title')">{{ t('admin.notAuthorized.title') }}</h1>
      <p :class="bemm('message')">{{ t('admin.notAuthorized.message') }}</p>
      <TButton
        type="primary"
        :icon="Icons.HOME"
        @click="goHome"
        :class="bemm('button')"
      >
        {{ t('admin.notAuthorized.goHome') }}
      </TButton>
    </TCard>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { useI18n, TCard, TIcon, TButton } from '@tiko/ui'
import { Icons } from 'open-icon'

const { t } = useI18n()
const bemm = useBemm('not-authorized')

const goHome = () => {
  // Redirect to the main website or app selection page
  window.location.href = '/'
}
</script>

<style lang="scss">
.not-authorized {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space);

  &__card {
    text-align: center;
    padding: var(--space-xl);
    max-width: 400px;
    width: 100%;
  }

  &__icon {
    color: var(--color-error);
    margin-bottom: var(--space);
  }

  &__title {
    font-size: var(--font-size-xl);
    margin-bottom: var(--space);
    color: var(--color-text-primary);
  }

  &__message {
    font-size: var(--font-size-m);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-l);
  }

  &__button {
    margin: 0 auto;
  }
}
</style>