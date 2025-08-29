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

</style>
