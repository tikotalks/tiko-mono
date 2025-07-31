<template>
  <section :class="bemm()">
    <div :class="bemm('container')">
      <h2 v-if="content?.title" :class="bemm('title')">
        {{ content.title }}
      </h2>
      <div :class="bemm('grid')">
        <TCard 
          v-for="(item, index) in items" 
          :key="index" 
          :class="bemm('card')"
        >
          <TIcon 
            v-if="item.icon" 
            :name="getIcon(item.icon)" 
            size="large" 
          />
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
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

interface FeaturesSectionProps {
  section: ContentSection
  content: any
}

const props = defineProps<FeaturesSectionProps>()
const bemm = useBemm('features-section')

const items = computed(() => {
  return props.content?.items || []
})

function getIcon(iconName: string) {
  return Icons[iconName as keyof typeof Icons] || Icons.STAR_M
}
</script>

<style lang="scss">
.features-section {
  padding: var(--space-2xl) 0;
  background: var(--color-background);

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
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--space);
  }

  &__card {
    text-align: center;
    padding: var(--space-lg);

    h3 {
      margin: var(--space) 0 var(--space-s);
      color: var(--color-foreground);
    }

    p {
      color: var(--color-foreground-secondary);
    }
  }

  @media (max-width: 768px) {
    &__grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>