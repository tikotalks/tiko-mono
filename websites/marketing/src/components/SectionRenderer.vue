<template>
  <component
    :is="sectionComponent"
    v-if="sectionComponent"
    :section="section"
    :content="section.content"
  />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import type { ContentSection } from '@tiko/core'

interface SectionRendererProps {
  section: ContentSection
}

const props = defineProps<SectionRendererProps>()

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

// Get the component based on section type or template
const sectionComponent = computed(() => {
  const type = props.section.template?.key || props.section.type || 'text'
  return sectionComponents[type as keyof typeof sectionComponents] || sectionComponents.text
})
</script>