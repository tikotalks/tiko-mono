<template>
  <section :class="bemm()">
    <div :class="bemm('container')">
      <h2 v-if="content?.title" :class="bemm('title')">
        {{ content.title }}
      </h2>
      <p v-if="content?.description" :class="bemm('description')">
        {{ content.description }}
      </p>
      <div :class="bemm('features')">
        <div 
          v-for="(feature, index) in features" 
          :key="index" 
          :class="bemm('feature')"
        >
          <TIcon 
            v-if="feature.icon"
            :name="getIcon(feature.icon)" 
          />
          <div>
            <h4>{{ feature.title }}</h4>
            <p>{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { TIcon } from '@tiko/ui'
import { Icons } from 'open-icon'
import { computed } from 'vue'
import type { ContentSection } from '@tiko/core'

interface ParentsSectionProps {
  section: ContentSection
  content: any
}

const props = defineProps<ParentsSectionProps>()
const bemm = useBemm('parents-section')

const features = computed(() => {
  return props.content?.items || []
})

function getIcon(iconName: string) {
  return Icons[iconName as keyof typeof Icons] || Icons.LOCK
}
</script>

<style lang="scss">
.parents-section {
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

  &__description {
    text-align: center;
    color: var(--color-foreground-secondary);
    max-width: 600px;
    margin: 0 auto var(--space-xl);
  }

  &__features {
    display: flex;
    flex-direction: column;
    gap: var(--space);
    max-width: 800px;
    margin: 0 auto;
  }

  &__feature {
    display: flex;
    gap: var(--space);
    align-items: start;

    h4 {
      color: var(--color-foreground);
      margin-bottom: var(--space-xs);
    }

    p {
      color: var(--color-foreground-secondary);
    }
  }
}
</style>