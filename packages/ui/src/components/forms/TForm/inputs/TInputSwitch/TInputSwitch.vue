<template>
  <div :class="bemm()">
    <label v-if="label" :class="bemm('label')">{{ label }}</label>

    <div :class="bemm('options')">
      <button
        v-for="option in formattedOptions"
        :key="String(option.value)"
        type="button"
        :class="bemm('option', {
          active: modelValue === option.value,
          disabled: option.disabled || disabled
        })"
        :disabled="option.disabled || disabled"
        @click="handleSelect(option.value)"
      >
        <TIcon v-if="option.icon" :name="option.icon" :class="bemm('option-icon')" />
        <span :class="bemm('option-label')">{{ option.label }}</span>
        <span v-if="option.count !== undefined" :class="bemm('option-count')">
          {{ option.count }}
        </span>
      </button>
    </div>

    <div v-if="error && error.length > 0" :class="bemm('error')">
      <span v-for="(err, idx) in error" :key="idx">{{ err }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useBemm } from 'bemm'
import TIcon from '../../../../ui-elements/TIcon/TIcon.vue'
import type { TInputSwitchProps, TInputSwitchEmits, SwitchOption } from './TInputSwitch.model'
import { Size } from '../../../../../types'

const props = withDefaults(defineProps<TInputSwitchProps>(), {
  label: '',
  options: () => [],
  size: Size.MEDIUM,
  disabled: false,
  error: () => [],
  required: false
})

const emit = defineEmits<TInputSwitchEmits>()

const bemm = useBemm('input-switch')

const modelValue = defineModel<string | number | boolean>()

// Format options to ensure consistent structure
const formattedOptions = computed<SwitchOption[]>(() => {
  return props.options.map(option => {
    if (typeof option === 'string') {
      return {
        label: option,
        value: option,
        icon: null,
        disabled: false
      }
    }
    return {
      ...option,
      disabled: option.disabled || false
    }
  })
})

// Handle option selection
const handleSelect = (value: string | number | boolean) => {
  if (props.disabled) return

  modelValue.value = value
  emit('update:modelValue', value)
  emit('change', value)
  emit('touched', true)
}

// Validate on mount if required
onMounted(() => {
  if (props.options.length === 0) {
    console.warn('TInputSwitch: No options provided')
  }
})
</script>

<style lang="scss">
@use '../../Form' as form;

.input-switch {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);

  &__label {
    font-weight: 500;
    color: var(--color-foreground);
    font-size: 0.875rem;
  }

  &__options {
    display: inline-flex;
    gap: 2px;
    padding: 2px;
    background: var(--color-background);
    border: 1px solid var(--color-accent);
    border-radius: var(--border-radius);
  }

  &__option {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-s);
    border: none;
    background: transparent;
    color: var(--color-foreground);
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: calc(var(--border-radius) - 2px);
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;

    &:hover:not(&--disabled) {
      background: var(--color-background-hover);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: -2px;
    }

    &--active {
      background: var(--color-primary);
      color: var(--color-primary-text);
    }

    &--disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__option-icon {
    width: 1em;
    height: 1em;
  }

  &__option-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.5em;
    height: 1.5em;
    padding: 0 0.25em;
    background: rgba(0, 0, 0, 0.1);
    border-radius: var(--border-radius-s);
    font-size: 0.75em;
    font-weight: 600;
  }

  &__error {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: var(--color-error);
  }

  // Size variants
  &--small {
    .input-switch__option {
      padding: calc(var(--space-xs) / 2) var(--space-xs);
      font-size: 0.75rem;
    }
  }

  &--large {
    .input-switch__option {
      padding: var(--space-s) var(--space);
      font-size: 1rem;
    }
  }
}</style>
