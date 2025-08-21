<template>
  <section :class="bemm()">
    <div :class="bemm('background')" v-if="content?.backgroundImage">
      <img
        :src="content.backgroundImage"
        :alt="content.title || ''"
        :class="bemm('background-image')"
      />
    </div>

    <div :class="bemm('container')">
      <div :class="bemm('content')">
        <h1 v-if="content?.title" :class="bemm('title')">
          {{ content.title }}
        </h1>

        <p v-if="content?.subtitle" :class="bemm('subtitle')">
          {{ content.subtitle }}
        </p>

        <TMarkdownRenderer
          v-if="content?.content"
          :content="content.content"
          :class="bemm('description')"
        />

        <div v-if="content?.buttons?.length" :class="bemm('actions')">
          <TButton
            v-for="(button, index) in content.buttons"
            :key="index"
            :type="index === 0 ? 'primary' : 'outline'"
            :size="'large'"
            :href="button.url"
            @click="handleButtonClick(button)"
          >
            {{ button.label }}
          </TButton>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { useRouter } from 'vue-router'
import type { ContentSection } from '@tiko/core'
import TButton from '../components/ui-elements/TButton/TButton.vue'
import TMarkdownRenderer from '../components/content/TMarkdownRenderer/TMarkdownRenderer.vue'

// Props
interface HeroButton {
  label: string
  url: string
  external?: boolean
}

interface Props {
  section: ContentSection
  content: {
    title?: string
    subtitle?: string
    content?: string
    backgroundImage?: string
    buttons?: HeroButton[]
  }
}

const props = defineProps<Props>()
const bemm = useBemm('t-hero-section')
const router = useRouter()

const handleButtonClick = (button: HeroButton) => {
  if (button.external) {
    window.open(button.url, '_blank')
  } else if (button.url.startsWith('http')) {
    window.location.href = button.url
  } else {
    router.push(button.url)
  }
}
</script>

<style lang="scss">
.t-hero-section {
  position: relative;
  padding: var(--space-4xl) 0;
  min-height: 60vh;
  display: flex;
  align-items: center;
  overflow: hidden;

  border: 1px solid red;

  &__background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.4),
        rgba(0, 0, 0, 0.6)
      );
    }
  }

  &__background-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__container {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 0 var(--space);
    width: 100%;
  }

  &__content {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
    color: white;

    .hero-section__background + .hero-section__container & {
      // When there's a background image, ensure text is white
      color: white;
    }
  }

  &__title {
    font-size: clamp(2.5rem, 5vw, 4rem);
    font-weight: var(--font-weight-bold);
    margin: 0 0 var(--space-l) 0;
    line-height: 1.1;
  }

  &__subtitle {
    font-size: var(--font-size-xl);
    margin: 0 0 var(--space-l) 0;
    opacity: 0.9;
  }

  &__description {
    font-size: var(--font-size-lg);
    margin: 0 0 var(--space-xl) 0;
    opacity: 0.9;

    p {
      margin-bottom: var(--space);
    }
  }

  &__actions {
    display: flex;
    gap: var(--space);
    justify-content: center;
    flex-wrap: wrap;
  }

  // When no background image
  &:not(:has(.t-hero-section__background)) {
    color: var(--color-text);
    background: var(--color-background);

    .t-hero-section__content {
      color: inherit;
    }

    .t-hero-section__title {
      color: var(--color-primary);
    }
  }
}
</style>
