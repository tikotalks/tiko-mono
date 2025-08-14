<template>
  <div :class="bemm()">
    <div :class="bemm('grid')">
      <button
        v-for="color in colors"
        :key="color"
        :class="bemm('color', ['', modelValue === color ? 'selected' : ''])"
        :style="{ backgroundColor: `var(--color-${color})`, color: `var(--color-${color}-text)` }"
        :aria-label="`Select ${color} color`"
        :aria-pressed="modelValue === color"
        type="button"
        @click="selectColor(color)"
      >
        <TIcon v-if="modelValue === color" :class="bemm('icon')" :name="Icons.CHECK_FAT" size="small" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm';
import TIcon from '../../ui-elements/TIcon/TIcon.vue';
import { BaseColors } from '../../../types';
import { Icons } from 'open-icon';

const bemm = useBemm('color-picker');

const props = defineProps<{
  modelValue?: string;
  colors?: string[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

// Use provided colors or default to BaseColors
const colors = props.colors || Object.values(BaseColors);

const selectColor = (color: string) => {
  emit('update:modelValue', color);
};
</script>

<style lang="scss">
.color-picker {
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
    gap: var(--space-xs);
    max-width: 400px;
  }

  &__color {
    position: relative;
    width: 40px;
    height: 40px;
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
&__icon{
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
