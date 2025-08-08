<template>
  <div :class="bemm()">
    <div :class="bemm('container')">
      <h1 :class="bemm('title')">404</h1>
      <h2 :class="bemm('subtitle')">{{ t('notFound.title') || 'Page Not Found' }}</h2>
      <p :class="bemm('description')">{{ t('notFound.description') || 'The page you are looking for doesn\'t exist or has been moved.' }}</p>
      <div :class="bemm('actions')">
        <TButton 
          color="primary" 
          size="large" 
          @click="goHome"
        >
          {{ t('notFound.backToHome') || 'Back to Home' }}
        </TButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import { useRouter } from 'vue-router';
import { TButton, useI18n } from '@tiko/ui';

const bemm = useBemm('not-found');
const router = useRouter();
const { t } = useI18n();

function goHome() {
  router.push('/');
}
</script>

<style lang="scss">
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-light);
  color: var(--color-dark);
  padding: var(--spacing);

  &__container {
    text-align: center;
    max-width: 600px;
  }

  &__title {
    font-size: clamp(6em, 10vw, 12em);
    font-family: var(--header-font-family);
    color: var(--color-primary);
    margin: 0;
    line-height: 1;
  }

  &__subtitle {
    font-size: clamp(2em, 3vw, 3em);
    color: var(--color-dark);
    margin-top: var(--space);
    margin-bottom: var(--space-l);
  }

  &__description {
    font-size: var(--font-size-lg);
    color: var(--color-foreground-secondary);
    margin-bottom: var(--space-xl);
  }

  &__actions {
    display: flex;
    justify-content: center;
    gap: var(--space);
  }
}
</style>