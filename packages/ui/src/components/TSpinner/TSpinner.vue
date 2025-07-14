<template>
  <div :class="bemm([size, color])">
    <svg :class="bemm('svg')" viewBox="0 0 50 50">
      <circle
        :class="bemm('circle')"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke-width="5"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import type { TSpinnerProps } from './TSpinner.model'

const bemm = useBemm('t-spinner')

const props = withDefaults(defineProps<TSpinnerProps>(), {
  size: 'medium',
  color: 'primary'
})
</script>

<style lang="scss">
.t-spinner {
  display: inline-block;
  
  &--small {
    width: 1.5em;
    height: 1.5em;
  }
  
  &--medium {
    width: 2.5em;
    height: 2.5em;
  }
  
  &--large {
    width: 4em;
    height: 4em;
  }
  
  &__svg {
    width: 100%;
    height: 100%;
    animation: rotate 2s linear infinite;
  }
  
  &__circle {
    stroke: var(--color-primary);
    stroke-linecap: round;
    animation: dash 1.5s ease-in-out infinite;
  }
  
  &--primary &__circle {
    stroke: var(--color-primary);
  }
  
  &--secondary &__circle {
    stroke: var(--color-secondary);
  }
  
  &--accent &__circle {
    stroke: var(--color-accent);
  }
  
  &--foreground &__circle {
    stroke: var(--color-foreground);
  }
  
  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }
  
  @keyframes dash {
    0% {
      stroke-dasharray: 1, 150;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -35;
    }
    100% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -124;
    }
  }
}
</style>