<template>
  <section :class="bemm()">
    {{ content.template }}
    <div :class="bemm('container')">
      <h6 v-if="content?.subtitle">{{ content.subtitle }}</h6>
      <h2 v-if="content?.title" :class="[bemm('title'),'title']">
        {{ content.title }}
      </h2>
      <TMarkdownRenderer v-if="content?.content" :class="bemm('content')" :content="content.content" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import type { ContentSection } from '@tiko/core'
import { TMarkdownRenderer } from '@tiko/ui'

interface TextSectionProps {
  section: ContentSection
  content: any
}

const props = defineProps<TextSectionProps>()
const bemm = useBemm('text-section')
</script>

<style lang="scss">
.text-section {
  padding: var(--spacing);
  background-color: var(--color-background);
  color: var(--color-foreground);

  &__container {
display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__title {
  }

  &__content {
    color: var(--color-foreground-secondary);
    line-height: 1.6;

    p {
      margin-bottom: var(--space);
    }
  }
}
</style>
