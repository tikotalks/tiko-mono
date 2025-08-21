<template>
  <div :class="bemm()" @click="openColorPicker">
    <!-- Selected color display -->
    <div
      :class="bemm('selected', ['',modelValue ? 'has-color' : 'no-color'])"
      :style="modelValue ? { backgroundColor: currentColor } : {}"
    >
      <span v-if="!modelValue" :class="bemm('placeholder')">
        {{ placeholder || t('common.selectColor') }}
      </span>
    </div>

    <!-- Dropdown icon -->
    <TIcon
      :name="Icons.CHEVRON_DOWN"
      size="small"
      :class="bemm('icon')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import { TIcon } from '../../ui-elements/TIcon'
import TColorPicker from '../TColorPicker/TColorPicker.vue'
import { useI18n } from '@tiko/core';
import { BaseColors, type Colors } from '../../../types'

const props = defineProps<{
  modelValue?: Colors
  colors?: Colors[]
  placeholder?: string
  size?: 'small' | 'medium' | 'large'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Colors]
}>()

const bemm = useBemm('t-color-picker-popup')
const { t } = useI18n()
const popupService = inject<any>('popupService')

const availableColors = computed(() => props.colors || Object.values(BaseColors))
const currentColor = computed(() => {
  if (!props.modelValue) return ''
  return `var(--color-${props.modelValue})`
})

const openColorPicker = () => {
  popupService.open({
    component: TColorPicker,
    title: t('common.selectColor'),
    size: 'small',
    props: {
      modelValue: props.modelValue,
      colors: availableColors.value,
      'onUpdate:modelValue': (color: Colors) => {
        emit('update:modelValue', color)
        popupService.close()
      }
    }
  })
}
</script>

<style lang="scss">
.t-color-picker-popup {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 75px;

  &:hover {
    border-color: var(--color-primary);
  }

  &:focus-within {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  &__selected {
    flex: 1;
    height: 2rem;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;

    &--has-color {
      // When a color is selected, add a subtle inner shadow for depth
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    &--no-color {
      background: var(--color-background-secondary);
    }
  }

  &__placeholder {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
  }

  &__icon {
    color: var(--color-text-secondary);
  }

  // Size variants
  &--small {
    padding: 0.375rem;
    min-width: 80px;

    .t-color-picker-popup__selected {
      height: 1.5rem;
    }
  }

  &--large {
    padding: 0.75rem;
    min-width: 160px;

    .t-color-picker-popup__selected {
      height: 2.5rem;
    }
  }
}
</style>
