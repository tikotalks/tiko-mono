<template>
  <div :class="bemm('', modifiers)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useBemm } from 'bemm';
import type { TButtonGroupProps } from './TButtonGroup.model';

const props = withDefaults(defineProps<TButtonGroupProps>(), {
  direction: 'row',
  fluid: false,
  gap: 's',
});

const bemm = useBemm('button-group');

const modifiers = computed(() => ({
  '': true,
  [props.direction]: true,
  fluid: props.fluid,
  [`gap-${props.gap}`]: true,
}));
</script>

<style lang="scss">
.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--button-group-gap, --space-s);

  &--row {
    flex-direction: row;
  }

  &--column {
    border: 1px solid red;
    flex-direction: column;
  }

  &--fluid {
    width: 100%;
    gap: 0;

    .button {
      --border-radius: 0;
      flex: 1;
      &:nth-child(1) {
        --border-radius: 1em 0 0 1em;
      }
      &:last-child {
        --border-radius: 0 1em 1em 0;
      }
    }
  }

  &--gap-xs {
    --button-group-gap:  var(--space-xs);
  }

  &--gap-s {
    --button-group-gap:  var(--space-s);
  }

  &--gap-m {
    --button-group-gap: var(--space);
  }

  &--gap-lg {
    --button-group-gap:  var(--space-lg);
  }

  &--gap-xl {
    --button-group-gap:  var(--space-xl);
  }

  .button {
    &,
    & + .button {
      margin: 0;
    }
  }
}
</style>
