<template>
  <div :class="bemm('',['',responsive ? 'responsive' : ''])" :style="gridStyles">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBemm } from 'bemm'
import type { TGridProps } from './TGrid.model'

const props = withDefaults(defineProps<TGridProps>(), {
  columns: 'auto-fill',
  gap: 'var(--space)',
  minItemWidth: '250px',
  responsive: true
})

const bemm = useBemm('t-grid')

const gridStyles = computed(() => {
  const styles: Record<string, string> = {
    gap: props.gap
  }

  if (typeof props.columns === 'number') {
    styles.gridTemplateColumns = `repeat(${props.columns}, 1fr)`
  } else if (props.columns === 'auto-fill' && props.minItemWidth) {
    styles.gridTemplateColumns = `repeat(auto-fill, minmax(${props.minItemWidth}, 1fr))`
  } else if (props.columns === 'auto-fit' && props.minItemWidth) {
    styles.gridTemplateColumns = `repeat(auto-fit, minmax(${props.minItemWidth}, 1fr))`
  } else {
    styles.gridTemplateColumns = props.columns as string
  }

  return styles
})
</script>

<style lang="scss">
.t-grid {
  display: grid;

  &--responsive {
    @media (max-width: 768px) {
      grid-template-columns: 1fr !important;
    }

    @media (max-width: 480px) {
      gap: var(--space-s) !important;
    }
  }
}
</style>
