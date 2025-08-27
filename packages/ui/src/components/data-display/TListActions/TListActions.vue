<template>
  <div :class="bemm('', { compact })" :style="{ justifyContent: alignment }">
    <TButton
      v-for="(action, index) in actions"
      :key="index"
      :type="action.buttonType || 'ghost'"
      :icon="action.icon"
      :color="action.color"
      :size="action.size || size"
      :disabled="action.disabled"
      :loading="action.loading"
      :tooltip="action.tooltip || action.label"
      @click="handleActionClick($event, action)"
    />
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import TButton from '../../ui-elements/TButton/TButton.vue'
import type { TListActionsProps } from './TListActions.model'
import type { ListAction } from '../TListItem/TListItem.model'

const props = withDefaults(defineProps<TListActionsProps>(), {
  size: 'small',
  alignment: 'flex-end',
  compact: false
})

const bemm = useBemm('list-actions')

const handleActionClick = (event: Event, action: ListAction) => {
  event.stopPropagation()
  if (action.handler && !action.disabled) {
    action.handler(event)
  }
}
</script>

<style lang="scss">
.list-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  min-width: fit-content;
  
  &--compact {
    gap: var(--space-xxs);
  }
}
</style>