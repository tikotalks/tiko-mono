<template>
  <section :class="bemm()">
    <div :class="bemm('container')">
      <h2 v-if="content?.title" :class="bemm('title')">{{ content.title }}</h2>
      <p v-if="content?.subtitle" :class="bemm('subtitle')">{{ content.subtitle }}</p>
      
      <ItemsRenderer
        :items="content?.testimonials"
        display-type="grid"
      >
        <template #item="{ item }">
          <div :class="bemm('testimonial')">
            <blockquote :class="bemm('quote')">
              {{ item.content }}
            </blockquote>
            <div :class="bemm('author-info')">
              <cite :class="bemm('author')">{{ item.author }}</cite>
              <span v-if="item.role" :class="bemm('role')">{{ item.role }}</span>
              <div v-if="item.rating" :class="bemm('rating')">
                <span v-for="i in 5" :key="i" :class="bemm('star', { filled: i <= item.rating })">
                  ★
                </span>
              </div>
            </div>
          </div>
        </template>
      </ItemsRenderer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import ItemsRenderer from '../ItemsRenderer.vue'

interface Props {
  section: any
  content?: Record<string, any>
}

defineProps<Props>()

const bemm = useBemm('testimonials-section')
</script>

<style lang="scss">
.testimonials-section {
  padding: var(--space-xl) 0;
  background: var(--color-background-secondary);
  
  &__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space-lg);
  }
  
  &__title {
    font-size: var(--font-size-xl);
    font-weight: 700;
    text-align: center;
    color: var(--color-foreground);
    margin: 0 0 var(--space) 0;
  }
  
  &__subtitle {
    font-size: var(--font-size-lg);
    text-align: center;
    color: var(--color-foreground-secondary);
    margin: 0 0 var(--space-xl) 0;
  }
  
  &__testimonial {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }
  
  &__quote {
    flex: 1;
    font-style: italic;
    font-size: var(--font-size-md);
    color: var(--color-foreground);
    margin: 0;
    line-height: 1.6;
    
    &::before {
      content: '"';
      font-size: 2em;
      color: var(--color-primary);
    }
    
    &::after {
      content: '"';
      font-size: 2em;
      color: var(--color-primary);
    }
  }
  
  &__author-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }
  
  &__author {
    font-weight: 600;
    color: var(--color-foreground);
    font-style: normal;
  }
  
  &__role {
    color: var(--color-foreground-secondary);
    font-size: var(--font-size-sm);
  }
  
  &__rating {
    display: flex;
    gap: 2px;
  }
  
  &__star {
    color: var(--color-border);
    font-size: var(--font-size-lg);
    
    &--filled {
      color: var(--color-warning);
    }
  }
}
</style>