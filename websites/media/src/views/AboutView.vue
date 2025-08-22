<template>
  <div :class="bemm()">
    <!-- Try to load from CMS first -->
    <TPageContent
      page-slug="about"
      :show-debug="false"
      @page-not-found="showStaticContent = true"
    />

    <!-- Fallback static content when CMS content not available -->
    <div v-if="showStaticContent" :class="bemm('static')">
      <div :class="bemm('header')">
        <h1 :class="bemm('title')">{{ t('media.about.title') }}</h1>
      </div>

      <div :class="bemm('content')">
        <section :class="bemm('section')">
          <h2>{{ t('media.about.mission.title') }}</h2>
          <p>{{ t('media.about.mission.description') }}</p>
        </section>

        <section :class="bemm('section')">
          <h2>{{ t('media.about.features.title') }}</h2>
          <div :class="bemm('features')">
            <div :class="bemm('feature')">
              <TIcon :name="Icons.IMAGE" :class="bemm('feature-icon')" />
              <h3>{{ t('media.about.features.highQuality.title') }}</h3>
              <p>{{ t('media.about.features.highQuality.description') }}</p>
            </div>
            <div :class="bemm('feature')">
              <TIcon :name="Icons.ARROW_DOWNLOAD" :class="bemm('feature-icon')" />
              <h3>{{ t('media.about.features.multipleFormats.title') }}</h3>
              <p>{{ t('media.about.features.multipleFormats.description') }}</p>
            </div>
            <div :class="bemm('feature')">
              <TIcon :name="Icons.SEARCH_L" :class="bemm('feature-icon')" />
              <h3>{{ t('media.about.features.easySearch.title') }}</h3>
              <p>{{ t('media.about.features.easySearch.description') }}</p>
            </div>
            <div :class="bemm('feature')">
              <TIcon :name="Icons.SHIELD3" :class="bemm('feature-icon')" />
              <h3>{{ t('media.about.features.safeBrowsing.title') }}</h3>
              <p>{{ t('media.about.features.safeBrowsing.description') }}</p>
            </div>
          </div>
        </section>

        <section :class="bemm('section')">
          <h2>{{ t('media.about.usage.title') }}</h2>
          <p>{{ t('media.about.usage.description') }}</p>
          <div :class="bemm('cta')">
            <TButton @click="router.push('/library')" size="large">
              {{ t('media.about.startBrowsing') }}
            </TButton>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { useI18n } from '@tiko/core'
import {
  TButton,
  TIcon,
  TPageContent
} from '@tiko/ui'

const bemm = useBemm('about-view')
const { t } = useI18n()
const router = useRouter()

// State
const showStaticContent = ref(false)
</script>

<style lang="scss">
.about-view {
  // TPageContent handles its own layout

  &__static {
    padding: var(--space-lg);
    max-width: 900px;
    margin: 0 auto;
  }

  &__header {
    margin-bottom: var(--space-xl);
    text-align: center;
  }

  &__title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    margin: 0;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xl);
  }

  &__section {
    h2 {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      margin: 0 0 var(--space) 0;
    }

    p {
      color: var(--color-foreground-secondary);
      line-height: 1.6;
      margin: 0;
    }
  }

  &__features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--space-lg);
    margin-top: var(--space-lg);
  }

  &__feature {
    text-align: center;
    padding: var(--space-lg);
    background: var(--color-background-secondary);
    border-radius: var(--border-radius-lg);

    h3 {
      font-size: var(--font-size);
      font-weight: var(--font-weight-bold);
      margin: var(--space) 0 var(--space-s) 0;
    }

    p {
      font-size: var(--font-size-s);
      color: var(--color-foreground-secondary);
      margin: 0;
    }
  }

  &__feature-icon {
    font-size: calc(var(--font-size-2xl) * 1.5);
    color: var(--color-primary);
  }

  &__cta {
    text-align: center;
    margin-top: var(--space-lg);
  }
}
</style>
