<template>
  <section :class="bemm()">
    <div :class="bemm('container')">
      <h2 v-if="content?.title" :class="bemm('title')">
        {{ content.title }}
      </h2>

      <TMarkdownRenderer
        v-if="content?.content"
        :content="content.content"
        :class="bemm('content')"
      />

      <div v-if="content?.subtitle" :class="bemm('subtitle')">
        {{ content.subtitle }}
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import type { ContentSection } from '@tiko/core'
import TMarkdownRenderer from '../components/content/TMarkdownRenderer/TMarkdownRenderer.vue'

// Props
interface Props {
  section: ContentSection
  content: {
    title?: string
    subtitle?: string
    content?: string
  }
}

defineProps<Props>()
const bemm = useBemm('text-section')
</script>

<style lang="scss">
.text-section {
  padding: var(--spacing);

  &:first-child{
    padding-top: calc(var(--spacing) + 100px);
  }

  &__container {
    max-width: var(--max-width-content);
    margin: 0 auto;
    padding: 0 var(--space);
  }

  &__title {
    font-size: var(--font-size-xxl);
    font-weight: var(--font-weight-bold);
    margin: 0 0 var(--space-l) 0;
    text-align: left;
  }

  &__subtitle {
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
    text-align: center;
    margin-top: var(--space-l);
  }

  &__content {
    font-size: var(--font-size-lg);
    line-height: 1.7;

    h1, h2, h3, h4, h5, h6 {
      margin-top: var(--space-xl);
      margin-bottom: var(--space);
    }

    p {
      margin-bottom: var(--space);
    }

    ul, ol {
      margin-bottom: var(--space);
      padding-left: var(--space-l);
    }
  }
}
</style>
