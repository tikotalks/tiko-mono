<template>
  <div :class="bemm()">
    <header :class="bemm('header')">
      <h1 :class="bemm('title')">Tiko UI Documentation</h1>
      <p :class="bemm('subtitle')">
        Complete documentation and testing suite for all Tiko UI components
      </p>
    </header>

    <section :class="bemm('categories')">
      <div
        v-for="category in categories"
        :key="category.id"
        :class="bemm('category')"
        @click="$router.push(category.route)"
      >
        <div :class="bemm('category-icon')">
          <TIcon :name="category.icon" size="2rem" />
        </div>
        <h3 :class="bemm('category-title')">{{ category.title }}</h3>
        <p :class="bemm('category-description')">{{ category.description }}</p>
        <div :class="bemm('category-count')">{{ category.count }} items</div>
      </div>
    </section>

    <section :class="bemm('info')">
      <h2>Quick Start</h2>
      <p>
        This documentation app showcases all available UI components in the Tiko design system.
        Each section demonstrates component usage, props, variants, and best practices.
      </p>

      <div :class="bemm('features')">
        <div :class="bemm('feature')">
          <TIcon name="code-brackets" />
          <h4>Code Examples</h4>
          <p>See working examples with syntax highlighting</p>
        </div>
        <div :class="bemm('feature')">
          <TIcon name="visible-fat" />
          <h4>Live Previews</h4>
          <p>Interactive component previews</p>
        </div>
        <div :class="bemm('feature')">
          <TIcon name="book" />
          <h4>Documentation</h4>
          <p>Complete prop and usage documentation</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { TIcon } from '@tiko/ui'

const bemm = useBemm('home-view')

const categories = [
  {
    id: 'buttons',
    title: 'Buttons',
    description: 'Interactive button components with various styles and states',
    icon: 'button',
    route: '/buttons',
    count: 12
  },
  {
    id: 'icons',
    title: 'Icons',
    description: 'Complete icon library with over 1000+ icons',
    icon: 'crown',
    route: '/icons',
    count: 1000
  },
  {
    id: 'inputs',
    title: 'Input Components',
    description: 'Form inputs, selects, textareas and validation',
    icon: 'text-bold',
    route: '/inputs',
    count: 8
  },
  {
    id: 'cards',
    title: 'Cards',
    description: 'Content containers and card layouts',
    icon: 'board',
    route: '/cards',
    count: 6
  },
  {
    id: 'colors',
    title: 'Color System',
    description: 'Color palette, themes and semantic colors',
    icon: 'art-supplies',
    route: '/colors',
    count: 50
  },
  {
    id: 'pin-input',
    title: 'PIN Input',
    description: 'Secure PIN entry component with visual feedback',
    icon: 'lock',
    route: '/pin-input',
    count: 1
  },
  {
    id: 'number-pad',
    title: 'Number Pad',
    description: 'Touch-friendly numeric keypad for number input',
    icon: 'keyboard',
    route: '/number-pad',
    count: 1
  }
]
</script>

<style lang="scss" scoped>
.home-view {
  padding: var(--space-lg);
  max-width: 1200px;
  margin: 0 auto;

  &__header {
    text-align: center;
    margin-bottom: var(--space-xl);
  }

  &__title {
    font-size: 3rem;
    font-weight: 700;
    color: var(--color-primary);
    margin: 0 0 var(--space);
  }

  &__subtitle {
    font-size: 1.25rem;
    color: var(--color-foreground-secondary);
    margin: 0;
    max-width: 600px;
    margin: 0 auto;
  }

  &__categories {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--space);
    margin-bottom: var(--space-xl);
  }

  &__category {
    background: var(--color-background);
    border: 2px solid var(--color-accent);
    border-radius: var(--radius-lg);
    padding: var(--space);
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: var(--color-primary);
    }

    &-icon {
      width: 3rem;
      height: 3rem;
      background: var(--color-primary);
      color: var(--color-primary-text);
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--space);
    }

    &-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-foreground);
      margin: 0 0 var(--space-s);
    }

    &-description {
      color: var(--color-foreground-secondary);
      margin: 0 0 var(--space-s);
      line-height: 1.5;
    }

    &-count {
      font-size: 0.875rem;
      color: var(--color-primary);
      font-weight: 500;
    }
  }

  &__info {
    background: var(--color-background-secondary);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);

    h2 {
      color: var(--color-foreground);
      margin: 0 0 var(--space);
    }

    p {
      color: var(--color-foreground-secondary);
      line-height: 1.6;
      margin: 0 0 var(--space-lg);
    }
  }

  &__features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space);
  }

  &__feature {
    text-align: center;

    .icon {
      color: var(--color-primary);
      margin-bottom: var(--space-s);
    }

    h4 {
      color: var(--color-foreground);
      margin: 0 0 var(--space-s);
      font-weight: 600;
    }

    p {
      color: var(--color-foreground-secondary);
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.4;
    }
  }
}

@media (max-width: 768px) {
  .home-view {
    padding: var(--space);

    &__title {
      font-size: 2rem;
    }

    &__categories {
      grid-template-columns: 1fr;
    }
  }
}
</style>
