<template>
  <div :class="bemm()">
    <div v-if="items && items.length > 0" :class="bemm('list', displayType)">
      <div
        v-for="(item, index) in items"
        :key="index"
        :class="bemm('item')"
      >
        <slot name="item" :item="item" :index="index">
          <!-- Default rendering for common item structures -->
          <h3 v-if="item.title" :class="bemm('title')">{{ item.title }}</h3>
          <h4 v-if="item.subtitle" :class="bemm('subtitle')">{{ item.subtitle }}</h4>
          <p v-if="item.content" :class="bemm('content')">{{ item.content }}</p>

          <!-- For testimonials -->
          <blockquote v-if="item.quote" :class="bemm('quote')">{{ item.quote }}</blockquote>
          <cite v-if="item.author" :class="bemm('author')">
            {{ item.author }}
            <span v-if="item.role" :class="bemm('role')">{{ item.role }}</span>
          </cite>

          <!-- For features -->
          <div v-if="item.icon" :class="bemm('icon')">
            <TIcon :name="item.icon" />
          </div>
          <p v-if="item.description" :class="bemm('description')">{{ item.description }}</p>

          <!-- For FAQ -->
          <details v-if="item.question && item.answer" :class="bemm('faq')">
            <summary :class="bemm('question')">{{ item.question }}</summary>
            <div :class="bemm('answer')">{{ item.answer }}</div>
          </details>
        </slot>
      </div>
    </div>

    <div v-else :class="bemm('empty')">
      <slot name="empty">
        <!-- Empty state - usually hidden in production -->
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { TIcon } from '@tiko/ui'

interface Props {
  items?: any[]
  displayType?: 'grid' | 'list' | 'carousel' | 'accordion'
}

withDefaults(defineProps<Props>(), {
  displayType: 'list'
})

const bemm = useBemm('items-renderer')
</script>

<style lang="scss">
.items-renderer {
  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);

    &--grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--space-lg);
    }

    &--carousel {
      display: flex;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      gap: var(--space);

      .items-renderer__item {
        flex: 0 0 300px;
        scroll-snap-align: start;
      }
    }
  }

  &__item {
    background: var(--color-background);
    padding: var(--space-lg);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-accent);
  }

  &__title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0 0 var(--space-xs) 0;
  }

  &__subtitle {
    font-size: var(--font-size-md);
    font-weight: 500;
    color: var(--color-primary);
    margin: 0 0 var(--space) 0;
  }

  &__content {
    color: var(--color-foreground);
    line-height: 1.6;
    margin: 0;
  }

  &__quote {
    font-style: italic;
    font-size: var(--font-size-lg);
    color: var(--color-foreground);
    margin: 0 0 var(--space) 0;
    padding-left: var(--space-lg);
    border-left: 3px solid var(--color-primary);
  }

  &__author {
    display: block;
    font-weight: 600;
    color: var(--color-foreground);
    font-style: normal;
  }

  &__role {
    font-weight: 400;
    color: var(--color-foreground-secondary);

    &::before {
      content: " - ";
    }
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3em;
    height: 3em;
    background: var(--color-primary);
    color: var(--color-primary-text);
    border-radius: var(--radius-full);
    margin-bottom: var(--space);
  }

  &__description {
    color: var(--color-foreground-secondary);
    margin: 0;
  }

  &__faq {
    &[open] {
      .items-renderer__question::after {
        transform: rotate(180deg);
      }
    }
  }

  &__question {
    font-weight: 600;
    color: var(--color-foreground);
    cursor: pointer;
    padding: var(--space);
    background: var(--color-background-secondary);
    border-radius: var(--radius-md);
    display: flex;
    justify-content: space-between;
    align-items: center;

    &::after {
      content: "▼";
      font-size: 0.8em;
      transition: transform 0.2s ease;
    }

    &::-webkit-details-marker {
      display: none;
    }
  }

  &__answer {
    padding: var(--space);
    color: var(--color-foreground);
  }
}
</style>
