<template>
  <ColumnSection 
    :section="section" 
    :content="content" 
    alignment="right" 
  />
</template>

<script setup lang="ts">
import type { ContentSection } from '@tiko/core';
import ColumnSection from './ColumnSection.vue';

interface ColumnRightSectionProps {
  section: ContentSection;
  content: any;
}

defineProps<ColumnRightSectionProps>();
</script>

<style lang="scss">
// Override CSS custom properties for right alignment
.column-right-section {
  --column-flex-direction: row-reverse;
  
  .column-right-section__image img {
    left: 0;
    right: auto;
  }
}
</style>