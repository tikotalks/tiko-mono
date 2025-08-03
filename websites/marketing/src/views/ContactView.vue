<template>
  <div :class="bemm()">
    <div :class="bemm('container')">
      <h1>{{ t('marketing.contact.title') }}</h1>
      <p :class="bemm('subtitle')">{{ t('marketing.contact.subtitle') }}</p>
      
      <div :class="bemm('content')">
        <TCard :class="bemm('contact-card')">
          <h2>{{ t('marketing.contact.email.title') }}</h2>
          <p>{{ t('marketing.contact.email.description') }}</p>
          <a href="mailto:hello@tiko.app">hello@tiko.app</a>
        </TCard>

        <TCard :class="bemm('contact-card')">
          <h2>{{ t('marketing.contact.support.title') }}</h2>
          <p>{{ t('marketing.contact.support.description') }}</p>
          <TButton 
            color="primary"
            @click="openSupport"
            :icon="Icons.QUESTION_MARK_L"
          >
            {{ t('marketing.contact.support.cta') }}
          </TButton>
        </TCard>

        <TCard :class="bemm('contact-card')">
          <h2>{{ t('marketing.contact.feedback.title') }}</h2>
          <p>{{ t('marketing.contact.feedback.description') }}</p>
          <TButton 
            color="secondary"
            @click="openFeedback"
            :icon="Icons.MAIL"
          >
            {{ t('marketing.contact.feedback.cta') }}
          </TButton>
        </TCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { useI18n, TCard, TButton } from '@tiko/ui'
import { Icons } from 'open-icon'

const bemm = useBemm('contact-view')
const { t } = useI18n()

function openSupport() {
  window.location.href = 'mailto:support@tiko.app'
}

function openFeedback() {
  window.location.href = 'mailto:feedback@tiko.app'
}
</script>

<style lang="scss">
.contact-view {
  padding: var(--space-2xl) 0;
  min-height: 80vh;

  &__container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 var(--space);
  }

  &__subtitle {
    color: var(--color-foreground-secondary);
    font-size: var(--font-size-lg);
    text-align: center;
    margin-bottom: var(--space-2xl);
  }

  &__content {
    display: grid;
    gap: var(--space);
  }

  &__contact-card {
    padding: var(--space-lg);
    text-align: center;

    h2 {
      color: var(--color-foreground);
      margin-bottom: var(--space);
    }

    p {
      color: var(--color-foreground-secondary);
      margin-bottom: var(--space);
    }

    a {
      font-size: var(--font-size-lg);
      color: var(--color-primary);
    }
  }
}
</style>