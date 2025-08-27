<template>
  <ColumnSection 
    :section="section" 
    :content="content" 
    alignment="center" 
  />
</template>

<script setup lang="ts">
import type { ContentSection } from '@tiko/core';
import ColumnSection from './ColumnSection.vue';

interface ColumnCenterSectionProps {
  section: ContentSection;
  content: any;
}

defineProps<ColumnCenterSectionProps>();
</script>

<style lang="scss">
// Override CSS custom properties for center alignment
.column-center-section {
  --column-flex-direction: column;
  --column-content-width: 100%;
  --column-image-width: 100%;
  --column-image-position: relative;
  --column-image-position-x: auto;
  --column-image-position-y: auto;
  --column-image-transform: none;
  --column-image-aspect: 16/9;
  --column-content-align: center;
  --column-content-text-align: center;
  --column-content-max-width: 800px;
  --column-image-max-width: 600px;
  --column-image-margin: var(--space-l);
  
  .column-center-section__container {
    align-items: center;
  }
  
  .column-center-section__image img {
    width: 100%;
  }
}
</style>