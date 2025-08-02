<template>
  <div :class="bemm()">
    <div :class="bemm('container')">
      <h1>{{ t('marketing.about.title') }}</h1>
      <div :class="bemm('content')">
        <p>{{ t('marketing.about.intro') }}</p>

        <h2>{{ t('marketing.about.mission.title') }}</h2>
        <p>{{ t('marketing.about.mission.description') }}</p>

        <h2>{{ t('marketing.about.values.title') }}</h2>
        <div :class="bemm('values')">
          <div v-for="value in values" :key="value.title" :class="bemm('value')">
            <TIcon :name="value.icon" />
            <h3>{{ t(value.title) }}</h3>
            <p>{{ t(value.description) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { useI18n, TIcon } from '@tiko/ui'
import { Icons } from 'open-icon'

const bemm = useBemm('about-view')
const { t } = useI18n()

const values = [
  {
    icon: Icons.HEART,
    title: 'marketing.about.values.safety.title',
    description: 'marketing.about.values.safety.description'
  },
  {
    icon: Icons.LIGHTBULB,
    title: 'marketing.about.values.education.title',
    description: 'marketing.about.values.education.description'
  },
  {
    icon: Icons.SMILE,
    title: 'marketing.about.values.fun.title',
    description: 'marketing.about.values.fun.description'
  }
]
</script>

<style lang="scss">
.about-view {
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

  &__values {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--space);
    margin-top: var(--space);
  }

  &__value {
    text-align: center;
    padding: var(--space);
    background: var(--color-background-secondary);
    border-radius: var(--radius-lg);

    h3 {
      margin: var(--space-s) 0;
      color: var(--color-foreground);
    }

    p {
      font-size: var(--font-size-sm);
    }
  }
}
</style>
