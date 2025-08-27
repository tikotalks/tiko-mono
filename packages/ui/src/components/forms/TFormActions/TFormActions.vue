<template>
  <div :class="bemm('', ['',align])">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';

const bemm = useBemm('form-actions');

withDefaults(defineProps<{
  align?: 'left' | 'center' | 'right' | 'space-between';
}>(), {
  align: 'right'
});
</script>

<style lang="scss">
.form-actions {
  display: flex;
  gap: var(--space-s);
  margin-top: var(--space);
  padding-top: var(--space);
  border-top: 1px solid var(--color-accent);

  &--align {
    &-left {
      justify-content: flex-start;
    }

    &-center {
      justify-content: center;
    }

    &-right {
      justify-content: flex-end;
    }

    &-space-between {
      justify-content: space-between;
    }
  }

  // Mobile responsiveness
  @media (max-width: 480px) {
    flex-direction: column-reverse;
    gap: var(--space-xs);

    button {
      width: 100%;
    }
  }
}
</style>
