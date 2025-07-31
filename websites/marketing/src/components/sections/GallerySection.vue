<template>
  <section :class="bemm()">
    <div :class="bemm('container')">
      <h2 v-if="content?.title" :class="bemm('title')">
        {{ content.title }}
      </h2>
      <div :class="bemm('grid', { columns: content?.columns || 3 })">
        <div 
          v-for="(item, index) in items" 
          :key="index"
          :class="bemm('item')"
        >
          <img 
            v-if="item.image"
            :src="item.image"
            :alt="item.title || ''"
            :class="bemm('image')"
          />
          <div v-if="item.title || item.description" :class="bemm('content')">
            <h3 v-if="item.title">{{ item.title }}</h3>
            <p v-if="item.description">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { computed } from 'vue'
import type { ContentSection } from '@tiko/core'

interface GallerySectionProps {
  section: ContentSection
  content: any
}

const props = defineProps<GallerySectionProps>()
const bemm = useBemm('gallery-section')

const items = computed(() => {
  return props.content?.items || []
})
</script>

<style lang="scss">
.gallery-section {
  padding: var(--space-2xl) 0;

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

  &__grid {
    display: grid;
    gap: var(--space);

    &--columns-2 {
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    }

    &--columns-3 {
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }

    &--columns-4 {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }
  }

  &__item {
    overflow: hidden;
    border-radius: var(--radius);
    background: var(--color-background-secondary);
  }

  &__image {
    width: 100%;
    height: auto;
    display: block;
  }

  &__content {
    padding: var(--space);

    h3 {
      color: var(--color-foreground);
      margin-bottom: var(--space-xs);
    }

    p {
      color: var(--color-foreground-secondary);
      font-size: var(--font-size-sm);
    }
  }

  @media (max-width: 768px) {
    &__grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>