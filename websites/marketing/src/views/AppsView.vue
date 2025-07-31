<template>
  <div :class="bemm()">
    <div :class="bemm('container')">
      <h1>{{ t('marketing.apps.title') }}</h1>
      <p :class="bemm('subtitle')">{{ t('marketing.apps.subtitle') }}</p>
      
      <div :class="bemm('apps-grid')">
        <TCard 
          v-for="app in apps" 
          :key="app.id"
          :class="bemm('app-card')"
        >
          <div :class="bemm('app-header')">
            <div :class="bemm('app-icon')">
              <TIcon :name="app.icon" size="large" />
            </div>
            <div :class="bemm('app-info')">
              <h2>{{ t(app.name) }}</h2>
              <p :class="bemm('app-tagline')">{{ t(app.tagline) }}</p>
            </div>
          </div>
          
          <p :class="bemm('app-description')">{{ t(app.description) }}</p>
          
          <div :class="bemm('app-features')">
            <h3>{{ t('marketing.apps.features') }}</h3>
            <ul>
              <li v-for="feature in app.features" :key="feature">
                {{ t(feature) }}
              </li>
            </ul>
          </div>
          
          <div :class="bemm('app-actions')">
            <TButton 
              color="primary"
              @click="openApp(app.url)"
              :icon="Icons.OPEN_IN_NEW"
            >
              {{ t('marketing.apps.open') }}
            </TButton>
          </div>
        </TCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { useI18n, TCard, TIcon, TButton } from '@tiko/ui'
import { Icons } from 'open-icon'

const bemm = useBemm('apps-view')
const { t } = useI18n()

const apps = [
  {
    id: 'radio',
    name: 'marketing.apps.radio.name',
    tagline: 'marketing.apps.radio.tagline',
    description: 'marketing.apps.radio.fullDescription',
    icon: Icons.RADIO,
    url: 'https://radio.tiko.app',
    features: [
      'marketing.apps.radio.features.curated',
      'marketing.apps.radio.features.safe',
      'marketing.apps.radio.features.multilingual',
      'marketing.apps.radio.features.parental'
    ]
  },
  {
    id: 'timer',
    name: 'marketing.apps.timer.name',
    tagline: 'marketing.apps.timer.tagline',
    description: 'marketing.apps.timer.fullDescription',
    icon: Icons.CLOCK,
    url: 'https://timer.tiko.app',
    features: [
      'marketing.apps.timer.features.visual',
      'marketing.apps.timer.features.sounds',
      'marketing.apps.timer.features.presets',
      'marketing.apps.timer.features.fullscreen'
    ]
  },
  {
    id: 'cards',
    name: 'marketing.apps.cards.name',
    tagline: 'marketing.apps.cards.tagline',
    description: 'marketing.apps.cards.fullDescription',
    icon: Icons.CARD,
    url: 'https://cards.tiko.app',
    features: [
      'marketing.apps.cards.features.categories',
      'marketing.apps.cards.features.images',
      'marketing.apps.cards.features.audio',
      'marketing.apps.cards.features.progress'
    ]
  },
  {
    id: 'yesno',
    name: 'marketing.apps.yesno.name',
    tagline: 'marketing.apps.yesno.tagline',
    description: 'marketing.apps.yesno.fullDescription',
    icon: Icons.QUESTION_MARK,
    url: 'https://yesno.tiko.app',
    features: [
      'marketing.apps.yesno.features.simple',
      'marketing.apps.yesno.features.visual',
      'marketing.apps.yesno.features.audio',
      'marketing.apps.yesno.features.fun'
    ]
  }
]

function openApp(url: string) {
  window.open(url, '_blank')
}
</script>

<style lang="scss">
.apps-view {
  padding: var(--space-2xl) 0;
  min-height: 80vh;

  &__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space);
  }

  &__subtitle {
    color: var(--color-foreground-secondary);
    font-size: var(--font-size-lg);
    text-align: center;
    margin-bottom: var(--space-2xl);
  }

  &__apps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: var(--space);
  }

  &__app-card {
    padding: var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__app-header {
    display: flex;
    gap: var(--space);
    align-items: start;
  }

  &__app-icon {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary-10);
    border-radius: var(--radius-lg);
    flex-shrink: 0;
  }

  &__app-info {
    flex: 1;

    h2 {
      color: var(--color-foreground);
      margin-bottom: var(--space-xs);
    }
  }

  &__app-tagline {
    color: var(--color-primary);
    font-size: var(--font-size-sm);
  }

  &__app-description {
    color: var(--color-foreground-secondary);
    line-height: 1.6;
  }

  &__app-features {
    flex: 1;

    h3 {
      font-size: var(--font-size-md);
      color: var(--color-foreground);
      margin-bottom: var(--space-s);
    }

    ul {
      list-style: none;
      padding: 0;

      li {
        position: relative;
        padding-left: var(--space);
        margin-bottom: var(--space-xs);
        color: var(--color-foreground-secondary);

        &:before {
          content: '✓';
          position: absolute;
          left: 0;
          color: var(--color-success);
        }
      }
    }
  }

  &__app-actions {
    display: flex;
    gap: var(--space);
    margin-top: var(--space);
  }

  @media (max-width: 768px) {
    &__apps-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>