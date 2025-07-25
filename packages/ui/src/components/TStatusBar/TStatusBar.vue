<template>
  <Transition name="status-bar">
    <div v-if="show" :class="bemm()">
      <div :class="bemm('content')">
        <slot />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'

interface TStatusBarProps {
  show?: boolean
}

const props = withDefaults(defineProps<TStatusBarProps>(), {
  show: true
})

const bemm = useBemm('status-bar')
</script>

<style lang="scss">
.status-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-background);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin: var(--space);
  border-radius: var(--border-radius);

  box-shadow: 2px 2px 1em 0 color-mix(in srgb, var(--color-light), transparent 80%) inset;

  &__content {
    padding: var(--space) var(--space);
  }
}

// Transitions
.status-bar-enter-active,
.status-bar-leave-active {
  transition: transform 0.3s ease;
}

.status-bar-enter-from,
.status-bar-leave-to {
  transform: translateY(100%);
}
</style>
