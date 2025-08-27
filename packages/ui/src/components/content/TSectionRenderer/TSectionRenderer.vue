<template>
  <div :class="bemm()">
    <component
      :is="sectionComponent"
      v-if="sectionComponent"
      :section="section"
      :content="content"
    />

    <div v-else :class="bemm('unknown')">
      <TEmptyState
        :icon="Icons.PUZZLE"
        :title="`Unknown section type: ${section.section_template_id}`"
        :description="showDebug ? JSON.stringify(section, null, 2) : 'This section type is not registered'"
      />
    </div>

    <!-- Debug info -->
    <div v-if="showDebug" :class="bemm('debug')">
      <div :class="bemm('debug-header')">
        <strong>Section:</strong> {{ section.name }} ({{ section.section_template_id }})
      </div>
      <details :class="bemm('debug-details')">
        <summary>Section Data</summary>
        <pre>{{ JSON.stringify(section, null, 2) }}</pre>
      </details>
      <details :class="bemm('debug-details')">
        <summary>Content Data</summary>
        <pre>{{ JSON.stringify(content, null, 2) }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import type { ContentSection } from '@tiko/core'
import TEmptyState from '../../feedback/TEmptyState/TEmptyState.vue'
import { getSectionComponent } from '../../../sections/registry'

// Props
interface Props {
  section: ContentSection
  content?: Record<string, any>
  showDebug?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDebug: false
})

const bemm = useBemm('t-section-renderer')

// Get the appropriate component for this section type
const sectionComponent = computed(() => {
  const componentLoader = getSectionComponent(props.section.section_template_id)

  if (!componentLoader) {
    console.warn(`No component registered for section type: ${props.section.section_template_id}`)
    return null
  }

  // Return async component
  return defineAsyncComponent(componentLoader)
})
</script>

<style lang="scss">
.t-section-renderer {
  &__unknown {
    padding: var(--space-xl);
    margin: var(--space-xl) 0;
    border: 2px dashed var(--color-accent);
    border-radius: var(--border-radius);
  }

  &__debug {
    position: relative;
    margin: var(--space) 0;
    padding: var(--space);
    background: color-mix(in srgb, var(--color-warning), transparent 90%);
    border: 1px solid var(--color-warning);
    border-radius: var(--border-radius);
    font-size: var(--font-size-sm);
  }

  &__debug-header {
    margin-bottom: var(--space-s);
  }

  &__debug-details {
    margin-top: var(--space-s);

    summary {
      cursor: pointer;
      user-select: none;
      font-weight: var(--font-weight-medium);
    }

    pre {
      margin-top: var(--space-s);
      padding: var(--space-s);
      background: var(--color-background);
      border-radius: var(--border-radius-sm);
      overflow-x: auto;
      font-size: var(--font-size-xs);
    }
  }
}
</style>
