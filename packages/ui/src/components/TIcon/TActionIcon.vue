<template>
  <component
    :is="props.action ? 'button' : 'span'"
    @click="action ? action() : null"
    :class="bemm('icon')"
    :style="`--action-icon-color: var(--color-${props.color});`"
  >
    <TIcon :name="name" />
  </component>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';
import { Icons } from 'open-icon';
import { type PropType } from 'vue';

import { Colors } from '../../types';

const bemm = useBemm('action-icon');

const props = defineProps({
  name: {
    type: String as PropType<Icons | string>,
    default: '',
  },
  color: {
    type: String as PropType<Colors>,
    default: Colors,
  },
  action: {
    type: Function as PropType<() => void>,
    default: undefined,
  },
});
</script>

<style lang="scss">
.action-icon {
  background-color: color-mix(
    in srgb,
    transparent,
    var(--action-icon-color) 50%
  );
  color: var(--action-icon-color);
  border-radius: 50%;
  width: var(--action-icon-size, 2.5em);
  height: var(--action-icon-size, 2.5em);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
