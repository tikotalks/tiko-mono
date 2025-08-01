<template>
  <section :class="bemm()">
    <div :class="bemm('container')">
      <h2 v-if="content?.title" :class="bemm('title')">
        {{ content.title }}
      </h2>
      <div v-if="content?.body" :class="bemm('content')" v-html="content.body"></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import type { ContentSection } from '@tiko/core'

interface TextSectionProps {
  section: ContentSection
  content: any
}

const props = defineProps<TextSectionProps>()
const bemm = useBemm('text-section')
</script>

<style lang="scss">
.text-section {
  padding: var(--space-xl) 0;
  border: 1px solid red;

  &__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space);
  }

  &__title {
    font-size: var(--font-size-2xl);
    text-align: center;
    margin-bottom: var(--space-xl);
    color: var(--color-foreground);
  }

  &__content {
    max-width: 800px;
    margin: 0 auto;
    color: var(--color-foreground-secondary);
    line-height: 1.6;

    p {
      margin-bottom: var(--space);
    }
  }
}
</style>
