<template>
  <TButtonGroup :class="bemm()">
    <TButton
      :type="'icon-only'"
      :icon="tilesIcon"
      :size="size"
      :tooltip="t('common.cardView')"
      @click="emit('update:modelValue', 'tiles')"
    >
      {{ tilesLabel }}
    </TButton>
    <TButton
      :type="'icon-only'"
      :icon="listIcon"
      :size="size"
      :tooltip="t('common.listView')"
      @click="emit('update:modelValue', 'list')"
    >
      {{ listLabel }}
    </TButton>
  </TButtonGroup>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import { useI18n } from '@tiko/core';
import TButton from '../../ui-elements/TButton/TButton.vue'
import { Icons } from 'open-icon'
import type { TViewToggleProps } from './TViewToggle.model'
import TButtonGroup from '../../ui-elements/TButton/TButtonGroup.vue'

const props = withDefaults(defineProps<TViewToggleProps>(), {
  tilesLabel: '',
  listLabel: '',
  tilesIcon: Icons.BOARD_MULTI,
  listIcon: Icons.TEXT_ALIGN_JUSTIFY,
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

}
</style>
