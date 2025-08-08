<template>
  <div>    <!-- Debug info (remove in production) -->
    <pre v-if="showDebug">
      Section: {{ section.name || section.slug }}
      Template: {{ section.section_template_id }}
      Content: <pre>{{ content }}</pre>
    </pre>

    <!-- Dynamic component rendering -->
    <template v-if="sectionComponent">
      <component :is="sectionComponent" :section="section" :content="content" />
    </template>

    <!-- Fallback if no component found -->
    <div v-else>
      <p>Unknown section type: {{ sectionType }}</p>
      <pre>{{ section }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import type { ContentSection } from '@tiko/core';

interface SectionRendererProps {
  section: ContentSection;
  content?: Record<string, any>;
  showDebug?: boolean;
}

const props = withDefaults(defineProps<SectionRendererProps>(), {
  showDebug: false,
});

// Map section types to components
const sectionComponents = {
  hero: defineAsyncComponent(() => import('./sections/HeroSection.vue')),
  hero2: defineAsyncComponent(() => import('./sections/SecondaryHeroSection.vue')),
  about: defineAsyncComponent(() => import('./sections/AboutSection.vue')),
  columnleft: defineAsyncComponent(() => import('./sections/ColumnLeftSection.vue')),
  columnRight: defineAsyncComponent(() => import('./sections/ColumnRightSection.vue')),
  features: defineAsyncComponent(
    () => import('./sections/FeaturesSection.vue'),
  ),
  apps: defineAsyncComponent(() => import('./sections/AppsSection.vue')),
  appsList: defineAsyncComponent(() => import('./sections/AppsListSection.vue')),
  funding: defineAsyncComponent(() => import('./sections/FundingSection.vue')),
  open: defineAsyncComponent(() => import('./sections/OpenSection.vue')),
  languages: defineAsyncComponent(
    () => import('./sections/LanguagesSection.vue'),
  ),
  imageblocks: defineAsyncComponent(
    () => import('./sections/ImageBlockSection.vue'),
  ),
  parents: defineAsyncComponent(() => import('./sections/ParentsSection.vue')),
  text: defineAsyncComponent(() => import('./sections/TextSection.vue')),
  cta: defineAsyncComponent(() => import('./sections/CTASection.vue')),
  gallery: defineAsyncComponent(() => import('./sections/GallerySection.vue')),
  testimonials: defineAsyncComponent(
    () => import('./sections/TestimonialsSection.vue'),
  ),
};

// Get section type from slug or name
const sectionType = computed(() => {
  return (
    props.content?.template ||
    props.section.slug ||
    props.section.name?.toLowerCase() ||
    'text'
  );
});

// Get the component based on section type
const sectionComponent = computed(() => {
  return (
    sectionComponents[sectionType.value as keyof typeof sectionComponents] ||
    sectionComponents.text
  );
});
</script>

<style scoped>
pre:has(pre) {
  background: blue;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  padding: var(--spacing);
}
pre pre {
  background: red;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 500px;
}
</style>
