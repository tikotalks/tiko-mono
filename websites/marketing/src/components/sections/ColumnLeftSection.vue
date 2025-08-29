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

<style lang="scss" scoped>

</style>
