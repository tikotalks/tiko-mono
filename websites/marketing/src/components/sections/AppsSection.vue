<template>
  <section :class="bemm()">
    <div :class="bemm('container')">
      <h2 v-if="content?.title" :class="bemm('title')">
        {{ content.title }}
      </h2>
      <div :class="bemm('grid')">
        <TCard 
          v-for="app in apps" 
          :key="app.id"
          :class="bemm('card')"
          clickable
          @click="navigateToApp(app.url)"
        >
          <div :class="bemm('icon')">
            <TIcon 
              :name="getIcon(app.icon)" 
              size="large" 
            />
          </div>
          <h3>{{ app.name || app.title }}</h3>
          <p>{{ app.description }}</p>
        </TCard>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { TCard, TIcon } from '@tiko/ui'
import { Icons } from 'open-icon'
import { computed } from 'vue'
import type { ContentSection } from '@tiko/core'

interface AppsSectionProps {
  section: ContentSection
  content: any
}

const props = defineProps<AppsSectionProps>()
const bemm = useBemm('apps-section')

const apps = computed(() => {
  return props.content?.items || []
})

function getIcon(iconName: string) {
  return Icons[iconName as keyof typeof Icons] || Icons.CARD
}

function navigateToApp(url: string) {
  if (url) {
    window.open(url, '_blank')
  }
}
</script>

<style lang="scss">
.apps-section {
  padding: var(--space-2xl) 0;
  background: var(--color-background-secondary);

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
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: var(--space);
  }

  &__card {
    text-align: center;
    padding: var(--space);
    transition: transform 0.2s ease;

    &:hover {
      transform: translateY(-4px);
    }

    h3 {
      margin: var(--space-s) 0;
      color: var(--color-foreground);
    }

    p {
      color: var(--color-foreground-secondary);
      font-size: var(--font-size-sm);
    }
  }

  &__icon {
    width: 64px;
    height: 64px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary-10);
    border-radius: var(--radius-lg);
  }

  @media (max-width: 768px) {
    &__grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }
  }
}
</style>