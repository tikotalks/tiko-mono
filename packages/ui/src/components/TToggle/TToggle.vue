<template>
  <label :class="bemm('',['',disabled ? 'disabled' : ''])">
    <input
      type="checkbox"
      :class="bemm('input')"
      :checked="modelValue"
      :disabled="disabled"
      @change="handleChange"
    />
    <span :class="bemm('slider')" />
    <span v-if="label" :class="bemm('label')">{{ label }}</span>
  </label>
</template>

<script setup lang="ts">
import { useBemm } from 'bemm'
import type { TToggleProps } from './TToggle.model'

withDefaults(defineProps<TToggleProps>(), {
  modelValue: false,
  disabled: false,
  size: 'medium'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const bemm = useBemm('toggle')

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
}
</script>

<style lang="scss" scoped>
.toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-s);
  cursor: pointer;
  user-select: none;

  --toggle-scale: 1;
  --toggle-dot: calc(0.8em * var(--toggle-scale));
  --toggle-space: calc(0.2em * var(--toggle-scale));
  --toggle-width: calc(2em * var(--toggle-scale));

  // calculated values
  --toggle-height: calc(var(--toggle-dot) + (var(--toggle-space) * 2));

  &--disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &--small{
    --toggle-scale: 0.8;
  }
  &--medium {
    --toggle-scale: 1;
  }
  &--large {
    --toggle-scale: 1.2;
  }

  &__input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .toggle__slider {
      background-color: var(--color-primary);

      &::after {
        transform: translateX(calc(var(--toggle-width) - (var(--toggle-dot) + (var(--toggle-space) * 2))));
      }
    }

    &:focus + .toggle__slider {
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary), transparent 75%);
    }

    &:disabled + .toggle__slider {
      cursor: not-allowed;
    }
  }

  &__slider {

    position: relative;
    display: inline-block;
    width: var(--toggle-width);
    height: var(--toggle-height);
    background-color: color-mix(in srgb, var(--color-foreground), transparent 75%);
    border-radius: calc(var(--toggle-height) / 2);
    transition: background-color 0.2s ease;

    &::after {
      content: '';
      position: absolute;
      top: var(--toggle-space);
      left: var(--toggle-space);
      width: var(--toggle-dot);
      height: var(--toggle-dot);
      background-color: var(--color-background);
      border-radius: 50%;
      transition: transform 0.2s ease;
    }
  }

  &__label {
    color: var(--color-foreground);
    font-size: var(--font-size);
  }
}
</style>
