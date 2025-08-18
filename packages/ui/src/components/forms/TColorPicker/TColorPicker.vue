<template>
  <InputBase
    v-model="modelValue"
    :block="block"
    :label="label"
    :disabled="disabled"
    :inline="inline"
    :size="size"
    :description="description"
    @change="$emit('change', $event)"
    @touched="$emit('touched', $event)"
  >
    <template #control>
      <div :class="bemm('grid')">
        <button
          v-for="color in colors"
          :key="color"
          :class="bemm('color', ['', modelValue === color ? 'selected' : ''])"
          :style="{ backgroundColor: `var(--color-${color})`, color: `var(--color-${color}-text)` }"
          :aria-label="`Select ${color} color`"
          :aria-pressed="modelValue === color"
          type="button"
          :disabled="disabled"
          @click="selectColor(color)"
        >
          <TIcon v-if="modelValue === color" :class="bemm('icon')" :name="Icons.CHECK_FAT" size="small" />
        </button>
      </div>
    </template>
  </InputBase>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import InputBase from '../TForm/InputBase.vue';
import TIcon from '../../ui-elements/TIcon/TIcon.vue';
import { AllColors, BaseColors, Size } from '../../../types';
import { Icons } from 'open-icon';
import type { TColorPickerProps } from './TColorPicker.model';

const modelValue = defineModel<string>()

const props = withDefaults(defineProps<TColorPickerProps>(), {
  block: 'color-picker',
  colors: () => Object.values(AllColors) as string[],
  size: Size.MEDIUM,
  label: '',
  inline: false,
  disabled: false,
  description: ''
});

const emit = defineEmits<{
  change: [value: string]
  touched: [event: Event]
}>()

const bemm = useBemm(props.block);

// Use provided colors or default to BaseColors
const colors = props.colors || Object.values(BaseColors);

const selectColor = (color: string) => {
  if (!props.disabled) {
    modelValue.value = color;
    emit('change', color);
  }
};
</script>

<style lang="scss">
@use '../TForm/Form.scss' as form;

.color-picker {
  --color-size: calc(2em * var(--sizing, 1));

  @include form.inputBase();
  @include form.inputColorPicker();

  &--x-small {
    --color-scale: 0.66;
  }

  &--small {
    --color-scale: 0.75;
  }

  &--medium {
    --color-scale: 1;
  }

  &--large {
    --color-scale: 1.2;
  }


  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(var(--color-size), 1fr));
    gap: var(--space-xs);
    max-width: 100%;
  }

  &__color {
    position: relative;
    width: var(--color-size);
    height: var(--color-size);
    border: 2px solid transparent;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: var(--color-gray);
    overflow: hidden;

    // Center the check icon
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-white);

    // Add subtle shadow for better visibility
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &:hover {
      transform: scale(1.1);
      border-color: var(--color-foreground);
    }

    &--selected {
      border-color: var(--color-foreground);
      transform: scale(1.05);

      &:hover {
        transform: scale(1.1);
      }
    }

    &__icon {
      font-size: 1.5em;
    }
  }

  // Responsive adjustments
  @media (max-width: 480px) {
    &__grid {
      grid-template-columns: repeat(auto-fit, minmax(35px, 1fr));
    }

    &__color {
      width: 35px;
      height: 35px;
    }
  }
}
</style>
