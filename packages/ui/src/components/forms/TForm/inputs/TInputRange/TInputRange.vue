<template>
  <div :class="bemm('', { [size]: true, disabled, readonly, error: hasError })">
    <label v-if="label" :class="bemm('label')" :for="inputId">
      {{ label }}
      <span v-if="required" :class="bemm('required')">*</span>
    </label>

    <div v-if="description && !hasError" :class="bemm('description')">
      {{ description }}
    </div>

    <div :class="bemm('control-container')">
      <div
        v-if="showValue && valuePosition === 'left'"
        :class="bemm('value', ['left'])"
      >
        <span v-if="prefix" :class="bemm('prefix')">{{ prefix }}</span>
        {{ displayValue }}
        <span v-if="suffix" :class="bemm('suffix')">{{ suffix }}</span>
      </div>

      <div :class="bemm('track-wrapper')">
        <input
          :id="inputId"
          v-model="internalValue"
          :class="bemm('control')"
          type="range"
          :min="min"
          :max="max"
          :step="step"
          :disabled="disabled"
          :readonly="readonly"
          :aria-label="label"
          :aria-invalid="hasError"
          :aria-describedby="descriptionId"
          :style="progressStyle"
          @input="handleInput"
          @change="handleChange"
          @focus="handleFocus"
          @blur="handleBlur"
        />
        <div :class="bemm('track')" />
        <div :class="bemm('progress')" :style="progressStyle" />
      </div>

      <div
        v-if="showValue && valuePosition === 'right'"
        :class="bemm('value', ['right'])"
      >
        <span v-if="prefix" :class="bemm('prefix')">{{ prefix }}</span>
        {{ displayValue }}
        <span v-if="suffix" :class="bemm('suffix')">{{ suffix }}</span>
      </div>
    </div>

    <div v-if="hasError" :class="bemm('errors')">
      <div v-for="(err, idx) in errorMessages" :key="idx" :class="bemm('error')">
        <span :class="bemm('error-text')">{{ err }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBemm } from 'bemm'
import type { TInputRangeProps, TInputRangeEmits } from './TInputRange.model'

const props = withDefaults(defineProps<TInputRangeProps>(), {
  min: 0,
  max: 100,
  step: 1,
  size: 'medium',
  showValue: true,
  valuePosition: 'right'
})

const emit = defineEmits<TInputRangeEmits>()

const bemm = useBemm('input-range')

// Generate unique IDs
const inputId = `input-range-${Math.random().toString(36).substr(2, 9)}`
const descriptionId = `${inputId}-description`

// Internal value handling
const internalValue = ref(Number(props.modelValue) || props.min)

// Computed properties
const hasError = computed(() => Boolean(props.error))
const errorMessages = computed(() => {
  if (!props.error) return []
  return Array.isArray(props.error) ? props.error : [props.error]
})

const displayValue = computed(() => {
  const val = internalValue.value
  // Format value based on step precision
  if (props.step && props.step < 1) {
    const decimals = props.step.toString().split('.')[1]?.length || 1
    return val.toFixed(decimals)
  }
  return val.toString()
})

const progressStyle = computed(() => {
  const percent = ((internalValue.value - props.min) / (props.max - props.min)) * 100
  return {
    '--progress-percent': `${percent}%`
  }
})

// Event handlers
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  internalValue.value = value
  emit('update:modelValue', value)
  emit('input', value)
}

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  emit('change', value)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

// Watch for external value changes
import { watch } from 'vue'
watch(() => props.modelValue, (newValue) => {
  if (newValue !== undefined) {
    internalValue.value = Number(newValue)
  }
})
</script>

<style lang="scss" scoped>
@use '../../Form' as form;

.input-range {
  @include form.inputBase();

  &__control-container {
    display: flex;
    align-items: center;
    gap: calc(var(--space) * var(--sizing));
    padding: calc(var(--space-s) * var(--sizing));
    margin-top: calc(var(--space-xs) * var(--sizing));

    &::before {
      display: none; // Remove default input background
    }
  }

  &__control{
    padding: 0;
  }

  &__track-wrapper {
    position: relative;
    flex: 1;
    height: calc(1.5em * var(--sizing));
    display: flex;
    align-items: center;
  }

  &__track {
    position: absolute;
    width: 100%;
    height: calc(0.5em * var(--sizing));
    background: color-mix(in srgb, var(--color-foreground), var(--color-background) 85%);
    border-radius: calc(0.25em * var(--sizing));
    pointer-events: none;
  }

  &__progress {
    position: absolute;
    height: calc(0.5em * var(--sizing));
    width: var(--progress-percent, 0%);
    background: var(--color-primary);
    border-radius: calc(0.25em * var(--sizing));
    pointer-events: none;
    transition: width 0.1s ease-out;
  }

  &__control {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: calc(1.5em * var(--sizing));
    background: transparent;
    cursor: pointer;
    position: relative;
    z-index: 2;

    &:focus {
      outline: none;
    }

    // Webkit browsers (Chrome, Safari, Edge)
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: calc(1.5em * var(--sizing));
      height: calc(1.5em * var(--sizing));
      background: var(--color-primary);
      border: 2px solid var(--color-background);
      border-radius: 50%;
      cursor: pointer;
      box-shadow:
        0 0 0 1px color-mix(in srgb, var(--color-primary), var(--color-background) 50%),
        var(--drop-shadow);
      transition: all 0.2s ease;

      &:hover {
        transform: scale(1.1);
      }

      &:active {
        transform: scale(0.95);
        box-shadow:
          0 0 0 4px color-mix(in srgb, var(--color-primary), var(--color-background) 80%),
          var(--drop-shadow);
      }
    }

    // Firefox
    &::-moz-range-thumb {
      width: calc(1.5em * var(--sizing));
      height: calc(1.5em * var(--sizing));
      background: var(--color-primary);
      border: 2px solid var(--color-background);
      border-radius: 50%;
      cursor: pointer;
      box-shadow:
        0 0 0 1px color-mix(in srgb, var(--color-primary), var(--color-background) 50%),
        var(--drop-shadow);
      transition: all 0.2s ease;

      &:hover {
        transform: scale(1.1);
      }

      &:active {
        transform: scale(0.95);
        box-shadow:
          0 0 0 4px color-mix(in srgb, var(--color-primary), var(--color-background) 80%),
          var(--drop-shadow);
      }
    }

    &:focus::-webkit-slider-thumb {
      box-shadow:
        0 0 0 4px color-mix(in srgb, var(--color-primary), var(--color-background) 80%),
        var(--drop-shadow);
    }

    &:focus::-moz-range-thumb {
      box-shadow:
        0 0 0 4px color-mix(in srgb, var(--color-primary), var(--color-background) 80%),
        var(--drop-shadow);
    }

    // Remove default track styling
    &::-webkit-slider-runnable-track {
      -webkit-appearance: none;
      background: transparent;
    }

    &::-moz-range-track {
      background: transparent;
    }
  }

  &__value {
    min-width: calc(3em * var(--sizing));
    padding: calc(0.5em * var(--sizing)) calc(0.75em * var(--sizing));
    background: var(--color-accent);
    border-radius: calc(var(--border-radius) * 0.5);
    font-size: calc(0.875em * var(--sizing));
    font-weight: 600;
    text-align: center;
    font-variant-numeric: tabular-nums;

    &--left {
      margin-right: calc(var(--space-xs) * var(--sizing));
    }

    &--right {
      margin-left: calc(var(--space-xs) * var(--sizing));
    }
  }

  &__prefix,
  &__suffix {
    opacity: 0.7;
    font-size: 0.875em;
  }

  &--disabled {
    opacity: 0.5;

    .input-range__control {
      cursor: not-allowed;

      &::-webkit-slider-thumb {
        cursor: not-allowed;

        &:hover,
        &:active {
          transform: none;
        }
      }

      &::-moz-range-thumb {
        cursor: not-allowed;

        &:hover,
        &:active {
          transform: none;
        }
      }
    }
  }

  &--readonly {
    .input-range__control {
      cursor: default;

      &::-webkit-slider-thumb {
        cursor: default;
      }

      &::-moz-range-thumb {
        cursor: default;
      }
    }
  }
}

// High contrast mode
[data-contrast-mode] {
  .input-range {
    &__track {
      outline: 2px solid var(--color-foreground);
    }

    &__control {
      &::-webkit-slider-thumb,
      &::-moz-range-thumb {
        border-width: 3px;
        outline: 2px solid var(--color-foreground);
      }
    }
  }
}
</style>
