<template>
  <section :class="bemm()">
    <div :class="bemm('container')">
      <h1 v-if="content?.title" :class="bemm('title')">
        {{ content.title }}
      </h1>
      <p v-if="content?.subtitle" :class="bemm('subtitle')">
        {{ content.subtitle }}
      </p>
      <div v-if="content?.ctaText" :class="bemm('cta')">
        <TButton 
          color="primary" 
          size="large" 
          @click="handleCTAClick"
        >
          {{ content.ctaText }}
        </TButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { TButton } from '@tiko/ui'
import { useRouter } from 'vue-router'
import type { ContentSection } from '@tiko/core'

interface HeroSectionProps {
  section: ContentSection
  content: any
}

const props = defineProps<HeroSectionProps>()
const bemm = useBemm('hero-section')
const router = useRouter()

function handleCTAClick() {
  if (props.content?.ctaLink) {
    if (props.content.ctaLink.startsWith('http')) {
      window.open(props.content.ctaLink, '_blank')
    } else {
      router.push(props.content.ctaLink)
    }
  }
}
</script>

<style lang="scss">
.hero-section {
  background: linear-gradient(135deg, var(--color-primary-10), var(--color-secondary-10));
  padding: var(--space-2xl) 0;
  text-align: center;

  &__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space);
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

  @media (max-width: 768px) {
    &__title {
      font-size: var(--font-size-2xl);
    }

    &__subtitle {
      font-size: var(--font-size-md);
    }
  }
}
</style>