<template>
  <div :class="bemm('',['',direction])">
    <dl :class="bemm('list-item')" v-for="item in items" :key="item.key">
      <dt :class="bemm('title')">{{ item.key }}</dt>
      <dd :class="bemm('detail')">{{ item.value }}</dd>
    </dl>
  </div>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';
import type { TKeyValueModel } from './TKeyValue.model';

const bemm = useBemm('t-key-value');

const props = withDefaults(
  defineProps<{
    items: TKeyValueModel[];
    direction?: 'row' | 'column';
  }>(),
  {
    items: () => [],
    direction: 'row',
  },
);
</script>

<style lang="scss">

.t-key-value {
  --key-value-border: color-mix(in srgb, var(--color-primary), transparent 50%);
  --key-value-background:
    linear-gradient(
      to bottom,
      color-mix(in srgb, var(--color-primary), transparent 75%),
      transparent
    );

  // color-mix(in srgb, var(--color-primary), transparent 75%);
  display: flex;
  flex-direction: var(--direction, column);
  background:var(--key-value-background);
  border: 1px solid var(--key-value-border);
  border-radius: var(--border-radius);
  width: fit-content;
  max-width: 100%;
  margin: auto;
  box-shadow: 2px 2px 1em 0 color-mix(in srgb, var(--color-light), transparent 90%) inset,
    -2px -2px 1em 0 color-mix(in srgb, var(--color-primary), transparent 50%) inset;



  &--row{
    --direction: row;
  }
  &--column {
    --direction: column;
  }

  &__list-item {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border-right: 1px solid var(--key-value-border);
    padding: var(--space-s) var(--space);
    &:last-child {
      border-right: none;
    }
  }

  &__title {
    font-weight: var(--font-weight-bold);
    color: var(--color-foreground);
    text-transform: uppercase;
    font-size: .75em;
    font-weight: bold;
    color: var(--color-primary);
  }
  &__detail {
    color: var(--color-foreground-secondary);
  }
}

</style>
