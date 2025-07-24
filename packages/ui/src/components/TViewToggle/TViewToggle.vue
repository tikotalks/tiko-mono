<template>
  <div :class="bemm()">
    <TButton
      :type="modelValue === 'tiles' ? 'default' : 'ghost'"
      :icon="tilesIcon"
      :size="size"
      @click="emit('update:modelValue', 'tiles')"
    >
      {{ tilesLabel }}
    </TButton>
    <TButton
      :type="modelValue === 'list' ? 'default' : 'ghost'"
      :icon="listIcon"
      :size="size"
      @click="emit('update:modelValue', 'list')"
    >
      {{ listLabel }}
    </TButton>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { useI18n } from '../../composables/useI18n'
import { TButton } from '../TButton'
import { Icons } from 'open-icon'
import type { TViewToggleProps } from './TViewToggle.model'

const props = withDefaults(defineProps<TViewToggleProps>(), {
  tilesLabel: '',
  listLabel: '',
  tilesIcon: Icons.GRID_3X3,
  listIcon: Icons.LIST,
  size: 'small'
})

const emit = defineEmits<{
  'update:modelValue': [value: 'tiles' | 'list']
}>()

const bemm = useBemm('t-view-toggle')
const { t } = useI18n()

// Use provided labels or fall back to i18n keys
const tilesLabel = props.tilesLabel || t('common.views.tiles')
const listLabel = props.listLabel || t('common.views.list')
</script>

<style lang="scss">
.t-view-toggle {
  display: flex;
  gap: var(--space-xs);
}
</style>