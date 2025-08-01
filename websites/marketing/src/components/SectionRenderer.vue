<template>
  <div>
    <!-- Debug info (remove in production) -->
    <pre v-if="showDebug">
      Section: {{ section.name || section.slug }}
      Template: {{ section.section_template_id }}
      Content: {{ content }}
    </pre>
    
    <!-- Dynamic component rendering -->
    <component
      :is="sectionComponent"
      v-if="sectionComponent"
      :section="section"
      :content="content"
    />
    
    <!-- Fallback if no component found -->
    <div v-else>
      <p>Unknown section type: {{ sectionType }}</p>
      <pre>{{ section }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import type { ContentSection } from '@tiko/core'

interface SectionRendererProps {
  section: ContentSection
  content?: Record<string, any>
  showDebug?: boolean
}

const props = withDefaults(defineProps<SectionRendererProps>(), {
  showDebug: false
})

// Map section types to components
const sectionComponents = {
  hero: defineAsyncComponent(() => import('./sections/HeroSection.vue')),
  features: defineAsyncComponent(() => import('./sections/FeaturesSection.vue')),
  apps: defineAsyncComponent(() => import('./sections/AppsSection.vue')),
  parents: defineAsyncComponent(() => import('./sections/ParentsSection.vue')),
  text: defineAsyncComponent(() => import('./sections/TextSection.vue')),
  cta: defineAsyncComponent(() => import('./sections/CTASection.vue')),
  gallery: defineAsyncComponent(() => import('./sections/GallerySection.vue'))
}

// Get section type from slug or name
const sectionType = computed(() => {
  return props.section.slug || props.section.name?.toLowerCase() || 'text'
})

// Get the component based on section type
const sectionComponent = computed(() => {
  return sectionComponents[sectionType.value as keyof typeof sectionComponents] || sectionComponents.text
})
</script>
