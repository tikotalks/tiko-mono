<template>
  <section :class="bemm()">
    <div :class="bemm('content')">
      <TIcon :name="Icons.FOLDER_HEART" size="xxl" :class="bemm('icon')" />
      <h2 :class="bemm('title')">{{ t('media.collections.createYourOwn') }}</h2>
      <p :class="bemm('description')">
        {{ t('media.collections.signupInspiration') }}
      </p>
      <div :class="bemm('actions')">
        <TButton 
          @click="router.push('/auth/login')" 
          size="large"
        >
          {{ t('auth.login') }}
        </TButton>
        <TButton 
          @click="router.push('/auth/signup')" 
          type="outline" 
          size="large"
        >
          {{ t('auth.signup') }}
        </TButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import {
  useI18n,
  TButton,
  TIcon
} from '@tiko/ui'

const bemm = useBemm('signup-inspiration')
const { t } = useI18n()
const router = useRouter()
</script>

<style lang="scss">
.signup-inspiration {
  &__content {
    text-align: center;
    padding: var(--space-2xl);
    background: var(--color-surface);
    border-radius: var(--border-radius);
    max-width: 600px;
    margin: 0 auto;
  }

  &__icon {
    color: var(--color-primary);
    margin-bottom: var(--space-l);
    opacity: 0.8;
  }

  &__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    margin: 0 0 var(--space) 0;
    color: var(--color-primary);
  }

  &__description {
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-xl) 0;
    line-height: 1.6;
    font-size: var(--font-size-lg);
  }

  &__actions {
    display: flex;
    gap: var(--space);
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>