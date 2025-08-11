<template>
  <section :class="bemm()">
    <div :class="bemm('container')">
      <h2 v-if="content?.title" :class="bemm('title')">{{ content.title }}</h2>
      <p v-if="content?.subtitle" :class="bemm('subtitle')">{{ content.subtitle }}</p>

      <ItemsRenderer
        :items="content?.sponsors || content?.items"
        display-type="grid"
      >
        <template #item="{ item }">
          <div :class="bemm('sponsor')">
            <div v-if="item.logo" :class="bemm('logo')">
              <img :src="item.logo" :alt="item.name || item.title" />
            </div>
            <h3 v-if="item.name || item.title" :class="bemm('name')">
              {{ item.name || item.title }}
            </h3>
            <p v-if="item.description" :class="bemm('description')">
              {{ item.description }}
            </p>
            <a
              v-if="item.link || item.url"
              :href="item.link || item.url"
              :class="bemm('link')"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ item.linkText || 'Visit Website' }}
            </a>
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

const bemm = useBemm('sponsors-section')
</script>

<style lang="scss">
.sponsors-section {
  padding: var(--space-xl) 0;
  background: var(--color-background);

  &__container {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 0 var(--space);
  }

  &__title {
    font-size: var(--font-size-2xl);
    text-align: center;
    margin-bottom: var(--space);
    color: var(--color-foreground);
  }

  &__subtitle {
    text-align: center;
    color: var(--color-foreground-secondary);
    margin-bottom: var(--space-xl);
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  &__sponsor {
    background: var(--color-background-card);
    border-radius: var(--border-radius);
    padding: var(--space-lg);
    text-align: center;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space);
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }

  &__logo {
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--space);

    img {
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
    }
  }

  &__name {
    font-size: var(--font-size-lg);
    color: var(--color-foreground);
    margin: 0;
  }

  &__description {
    color: var(--color-foreground-secondary);
    flex: 1;
    margin: var(--space) 0;
  }

  &__link {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
