<template>
  <section :class="bemm()">
    <div :class="bemm('container')">
      <h2 v-if="content?.title" :class="bemm('title')">
        {{ content.title }}
      </h2>
      <p v-if="content?.description" :class="bemm('description')">
        {{ content.description }}
      </p>
      <div :class="bemm('actions')">
        <TButton 
          v-for="(action, index) in actions"
          :key="index"
          :color="action.color || 'primary'"
          :size="action.size || 'medium'"
          @click="handleAction(action)"
        >
          {{ action.text }}
        </TButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { TButton } from '@tiko/ui'
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import type { ContentSection } from '@tiko/core'

interface CTASectionProps {
  section: ContentSection
  content: any
}

const props = defineProps<CTASectionProps>()
const bemm = useBemm('cta-section')
const router = useRouter()

const actions = computed(() => {
  return props.content?.actions || []
})

function handleAction(action: any) {
  if (action.link) {
    if (action.link.startsWith('http')) {
      window.open(action.link, '_blank')
    } else {
      router.push(action.link)
    }
  }
}
</script>

<style lang="scss">
.cta-section {
  padding: var(--space-2xl) 0;
  background: var(--color-background-secondary);
  text-align: center;

  &__container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 var(--space);
  }

  &__title {
    font-size: var(--font-size-2xl);
    margin-bottom: var(--space);
    color: var(--color-foreground);
  }

  &__description {
    font-size: var(--font-size-lg);
    color: var(--color-foreground-secondary);
    margin-bottom: var(--space-xl);
  }

  &__actions {
    display: flex;
    justify-content: center;
    gap: var(--space);
    flex-wrap: wrap;
  }
}
</style>