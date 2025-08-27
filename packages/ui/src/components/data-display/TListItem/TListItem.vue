<template>
  <component
    :is="componentTag"
    :class="bemm('', ['',isClickable ? 'clickable' : '', props.selected ? 'selected' : ''])"
    :href="href"
    v-bind="componentProps"
    @click="handleClick"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBemm } from 'bemm'
import type { TListItemProps } from './TListItem.model'

const props = withDefaults(defineProps<TListItemProps>(), {
  tag: 'div',
  clickable: false,
  selected: false
})

const emit = defineEmits<{
  click: [event: Event]
}>()

const bemm = useBemm('t-list-item')

const componentTag = computed(() => {
  if (props.href) return 'a'
  return props.tag
})

const isClickable = computed(() => {
  return props.clickable || !!props.href || componentTag.value === 'button'
})

const componentProps = computed(() => {
  const baseProps: Record<string, any> = {}

  if (props.href) {
    baseProps.href = props.href
  }

  if (componentTag.value === 'button') {
    baseProps.type = 'button'
  }

  return baseProps
})

const handleClick = (event: Event) => {
  emit('click', event)
}
</script>

<style lang="scss">
.t-list-item {
  display: grid;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-accent);
  transition: background-color 0.2s;
  text-decoration: none;
  color: inherit;

  &:last-child {
    border-bottom: none;
  }

  &--clickable {
    cursor: pointer;

    &:hover {
      background: var(--color-secondary);
    }
  }

  &--selected {
    background: color-mix(in srgb, var(--color-primary), transparent 75%) !important;

    &:hover {
      background: var(--color-primary);
    }
  }
}
</style>
