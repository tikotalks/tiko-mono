<template>
  <div class="build-info">
    <span>Build: {{ buildTime }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const buildTime = computed(() => {
  // This will be replaced at build time
  return import.meta.env.VITE_BUILD_TIME || 'dev';
});
</script>

<style scoped>
.build-info {
  position: fixed;
  bottom: 10px;
  left: 10px;
  font-size: 10px;
  opacity: 0.5;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
}
</style>