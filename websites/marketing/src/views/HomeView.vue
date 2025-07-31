<template>
  <div :class="bemm()">
    <!-- Hero Section -->
    <section :class="bemm('hero')">
      <div :class="bemm('container')">
        <h1 :class="bemm('title')">{{ t('marketing.home.hero.title') }}</h1>
        <p :class="bemm('subtitle')">{{ t('marketing.home.hero.subtitle') }}</p>
        <div :class="bemm('cta')">
          <TButton 
            color="primary" 
            size="large" 
            @click="$router.push('/apps')"
          >
            {{ t('marketing.home.hero.cta') }}
          </TButton>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section :class="bemm('features')">
      <div :class="bemm('container')">
        <h2 :class="bemm('section-title')">{{ t('marketing.home.features.title') }}</h2>
        <div :class="bemm('features-grid')">
          <TCard v-for="feature in features" :key="feature.icon" :class="bemm('feature-card')">
            <TIcon :name="feature.icon" size="large" />
            <h3>{{ t(feature.title) }}</h3>
            <p>{{ t(feature.description) }}</p>
          </TCard>
        </div>
      </div>
    </section>

    <!-- Apps Preview Section -->
    <section :class="bemm('apps-preview')">
      <div :class="bemm('container')">
        <h2 :class="bemm('section-title')">{{ t('marketing.home.apps.title') }}</h2>
        <div :class="bemm('apps-grid')">
          <TCard 
            v-for="app in apps" 
            :key="app.id"
            :class="bemm('app-card')"
            clickable
            @click="navigateToApp(app.url)"
          >
            <div :class="bemm('app-icon')">
              <TIcon :name="app.icon" size="large" />
            </div>
            <h3>{{ t(app.name) }}</h3>
            <p>{{ t(app.description) }}</p>
          </TCard>
        </div>
      </div>
    </section>

    <!-- Parent Section -->
    <section :class="bemm('parents')">
      <div :class="bemm('container')">
        <h2 :class="bemm('section-title')">{{ t('marketing.home.parents.title') }}</h2>
        <p :class="bemm('section-description')">{{ t('marketing.home.parents.description') }}</p>
        <div :class="bemm('parent-features')">
          <div v-for="feature in parentFeatures" :key="feature.title" :class="bemm('parent-feature')">
            <TIcon :name="feature.icon" />
            <div>
              <h4>{{ t(feature.title) }}</h4>
              <p>{{ t(feature.description) }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { useI18n, TButton, TCard, TIcon } from '@tiko/ui'
import { Icons } from 'open-icon'

const bemm = useBemm('home-view')
const { t } = useI18n()

// Features data
const features = [
  {
    icon: Icons.STAR_M,
    title: 'marketing.home.features.educational.title',
    description: 'marketing.home.features.educational.description'
  },
  {
    icon: Icons.SHIELD_CHECK,
    title: 'marketing.home.features.safe.title',
    description: 'marketing.home.features.safe.description'
  },
  {
    icon: Icons.SPEECH_BALLOONS,
    title: 'marketing.home.features.multilingual.title',
    description: 'marketing.home.features.multilingual.description'
  }
]

// Apps data
const apps = [
  {
    id: 'radio',
    name: 'marketing.apps.radio.name',
    description: 'marketing.apps.radio.description',
    icon: Icons.RADIO,
    url: 'https://radio.tiko.app'
  },
  {
    id: 'timer',
    name: 'marketing.apps.timer.name',
    description: 'marketing.apps.timer.description',
    icon: Icons.CLOCK,
    url: 'https://timer.tiko.app'
  },
  {
    id: 'cards',
    name: 'marketing.apps.cards.name',
    description: 'marketing.apps.cards.description',
    icon: Icons.CARD,
    url: 'https://cards.tiko.app'
  },
  {
    id: 'yesno',
    name: 'marketing.apps.yesno.name',
    description: 'marketing.apps.yesno.description',
    icon: Icons.QUESTION_MARK,
    url: 'https://yesno.tiko.app'
  }
]

// Parent features
const parentFeatures = [
  {
    icon: Icons.LOCK,
    title: 'marketing.home.parents.features.control.title',
    description: 'marketing.home.parents.features.control.description'
  },
  {
    icon: Icons.STAR,
    title: 'marketing.home.parents.features.noads.title',
    description: 'marketing.home.parents.features.noads.description'
  },
  {
    icon: Icons.ANALYTICS,
    title: 'marketing.home.parents.features.privacy.title',
    description: 'marketing.home.parents.features.privacy.description'
  }
]

// Navigate to app
function navigateToApp(url: string) {
  window.open(url, '_blank')
}
</script>

<style lang="scss">
.home-view {
  &__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space);
  }

  &__hero {
    background: linear-gradient(135deg, var(--color-primary-10), var(--color-secondary-10));
    padding: var(--space-2xl) 0;
    text-align: center;
  }

  &__title {
    font-size: var(--font-size-3xl);
    color: var(--color-foreground);
    margin-bottom: var(--space);
  }

  &__subtitle {
    font-size: var(--font-size-lg);
    color: var(--color-foreground-secondary);
    margin-bottom: var(--space-xl);
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  &__cta {
    display: flex;
    justify-content: center;
    gap: var(--space);
  }

  &__features {
    padding: var(--space-2xl) 0;
    background: var(--color-background);
  }

  &__section-title {
    font-size: var(--font-size-2xl);
    text-align: center;
    margin-bottom: var(--space-xl);
    color: var(--color-foreground);
  }

  &__section-description {
    text-align: center;
    color: var(--color-foreground-secondary);
    max-width: 600px;
    margin: 0 auto var(--space-xl);
  }

  &__features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--space);
  }

  &__feature-card {
    text-align: center;
    padding: var(--space-lg);

    h3 {
      margin: var(--space) 0 var(--space-s);
      color: var(--color-foreground);
    }

    p {
      color: var(--color-foreground-secondary);
    }
  }

  &__apps-preview {
    padding: var(--space-2xl) 0;
    background: var(--color-background-secondary);
  }

  &__apps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: var(--space);
  }

  &__app-card {
    text-align: center;
    padding: var(--space);
    transition: transform 0.2s ease;

    &:hover {
      transform: translateY(-4px);
    }

    h3 {
      margin: var(--space-s) 0;
      color: var(--color-foreground);
    }

    p {
      color: var(--color-foreground-secondary);
      font-size: var(--font-size-sm);
    }
  }

  &__app-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary-10);
    border-radius: var(--radius-lg);
  }

  &__parents {
    padding: var(--space-2xl) 0;
    background: var(--color-background);
  }

  &__parent-features {
    display: flex;
    flex-direction: column;
    gap: var(--space);
    max-width: 800px;
    margin: 0 auto;
  }

  &__parent-feature {
    display: flex;
    gap: var(--space);
    align-items: start;

    h4 {
      color: var(--color-foreground);
      margin-bottom: var(--space-xs);
    }

    p {
      color: var(--color-foreground-secondary);
    }
  }

  // Responsive design
  @media (max-width: 768px) {
    &__title {
      font-size: var(--font-size-2xl);
    }

    &__subtitle {
      font-size: var(--font-size-md);
    }

    &__features-grid {
      grid-template-columns: 1fr;
    }

    &__apps-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }
  }
}
</style>