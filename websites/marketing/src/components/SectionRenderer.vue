<template>
  <div>
    <!-- Debug info (remove in production) -->
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
  hero2: defineAsyncComponent(
    () => import('./sections/SecondaryHeroSection.vue'),
  ),
  about: defineAsyncComponent(() => import('./sections/AboutSection.vue')),
  columnleft: defineAsyncComponent(
    () => import('./sections/ColumnLeftSection.vue'),
  ),
  columnright: defineAsyncComponent(
    () => import('./sections/ColumnRightSection.vue'),
  ),
  columncenter: defineAsyncComponent(
    () => import('./sections/ColumnCenterSection.vue'),
  ),
  features: defineAsyncComponent(
    () => import('./sections/FeaturesSection.vue'),
  ),
  apps: defineAsyncComponent(() => import('./sections/AppsSection.vue')),
  appsList: defineAsyncComponent(
    () => import('./sections/AppsListSection.vue'),
  ),
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
  'tile-gallery': defineAsyncComponent(
    () => import('./sections/ImageStreamSection.vue'),
  ),
};

// Get section type from slug or name
const sectionType = computed(() => {
  const type =
    props.content?.template ||
   (props.section as any).template?.slug ||
    props.section.slug ||
    props.section.name?.toLowerCase() ||
    'text';

  return type;
});

// Get the component based on section type
const sectionComponent = computed(() => {

  const type = sectionType.value as keyof typeof sectionComponents;

  // First try exact match
  let component = sectionComponents[type];

  // If not found, try lowercase version
  if (!component) {
    const lowercaseType = sectionType.value.toLowerCase();
    component =
      sectionComponents[lowercaseType as keyof typeof sectionComponents];
  }

  // Fallback to text component
  return component || sectionComponents.text;
});
</script>

<style>
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
