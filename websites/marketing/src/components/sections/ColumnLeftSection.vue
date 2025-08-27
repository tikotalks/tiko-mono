<template>
  <ColumnSection 
    :section="section" 
    :content="content" 
    alignment="left" 
  />
</template>

<script setup lang="ts">
import type { ContentSection } from '@tiko/core';
import ColumnSection from './ColumnSection.vue';

interface ColumnLeftSectionProps {
  section: ContentSection;
  content: any;
}

defineProps<ColumnLeftSectionProps>();
</script>

<style lang="scss">
// Override CSS custom properties for left alignment
.column-left-section {
  // Already using default values from base
  
  .column-left-section__image img {
    left: auto;
    right: 0;
  }
}
</style>