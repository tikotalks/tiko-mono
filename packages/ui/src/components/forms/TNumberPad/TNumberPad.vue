<template>
  <div :class="bemm('',{ [size]: true, [variant]: true })">
    <button
      v-for="num in numbers"
      :key="num"
      type="button"
      :class="bemm('button', { number: true })"
      :disabled="disabled"
      @click="handleNumberClick(num.toString())"
    >
      {{ num }}
    </button>

    <button
      v-if="showClear"
      type="button"
      :class="bemm('button', { clear: true })"
      :disabled="disabled || disableClear"
      @click="handleClearClick"
    >
      <slot name="clear">
        <TIcon :name="clearIcon" />
      </slot>
    </button>

    <button
      type="button"
      :class="bemm('button', { number: true, zero: true })"
      :disabled="disabled"
      @click="handleNumberClick('0')"
    >
      0
    </button>

    <button
      v-if="showSubmit"
      type="button"
      :class="bemm('button',['', 'submit'])"
      :disabled="disabled || disableSubmit"
      @click="handleSubmitClick"
    >
      <slot name="submit">
        <TIcon :name="submitIcon" />
      </slot>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBemm } from 'bemm'
import { Icons } from 'open-icon'
import TIcon from '../../ui-elements/TIcon/TIcon.vue'
import type { TNumberPadProps, TNumberPadEmits } from './TNumberPad.model'

const props = withDefaults(defineProps<TNumberPadProps>(), {
  showClear: true,
  showSubmit: true,
  disabled: false,
  disableClear: false,
  disableSubmit: false,
  clearIcon: Icons.CHEVRON_LEFT,
  submitIcon: Icons.ARROW_RIGHT,
  size: 'medium',
  variant: 'default'
})

const emit = defineEmits<TNumberPadEmits>()

const bemm = useBemm('number-pad', {
  includeBaseClass: true
})

// Computed
const numbers = computed(() => {
  return props.shuffle ? shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]) : [1, 2, 3, 4, 5, 6, 7, 8, 9]
})

// Methods
const handleNumberClick = (num: string) => {
  emit('number', num)
}

const handleClearClick = () => {
  emit('clear')
}

const handleSubmitClick = () => {
  emit('submit')
}

const shuffleArray = (array: number[]): number[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
</script>

<style lang="scss" scoped>
.number-pad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-s);
  width: 15em;
  max-width: 20em;

  &__button {
    aspect-ratio: 1;
    min-height: var(--space-xl);
    border: 2px solid var(--color-primary);
    border-radius: var(--border-radius);
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-size: 1.25em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;

    // Ripple effect on click
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle, var(--color-primary) 0%, transparent 70%);
      opacity: 0;
      transform: scale(0);
      transition: opacity 0.3s, transform 0.3s;
    }

    &:active:not(:disabled)::after {
      opacity: 0.3;
      transform: scale(1);
      transition: none;
    }

    &:hover:not(:disabled) {
      background-color: color-mix(in srgb, var(--color-primary), transparent 90%);
      border-color: var(--color-foreground);
      transform: scale(1.05);
      box-shadow: 0 2px 8px color-mix(in srgb, var(--color-primary), transparent 80%);
    }

    &:active:not(:disabled) {
      transform:scale(.95);
      box-shadow: 0 1px 4px color-mix(in srgb, var(--color-primary), transparent 80%);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &--clear {
      background-color: var(--color-accent);
      color: var(--color-foreground);
      border-color: var(--color-accent);

      &:hover:not(:disabled) {
        background-color: var(--color-background-secondary);
        border-color: var(--color-primary);
      }
      .icon{
        font-size: 2em;
      }
    }

    &--submit {
      background-color: var(--color-success);
      border-color: var(--color-success);
      color: var(--color-success-text);

      &:hover:not(:disabled) {
        opacity: 0.9;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px color-mix(in srgb, var(--color-success), transparent 60%);
      }
      .icon{
        font-size: 2em;
      }
    }
  }

  // Size variants
  &--small {
    gap: var(--space-xs);
    max-width: 15em;

    .number-pad__button {
      min-height: var(--space-l);
      font-size: 1em;
    }
  }

  &--large {
    gap: var(--space);
    max-width: 25em;

    .number-pad__button {
      min-height: calc(var(--space-xl) * 1.33);
      font-size: 1.5em;
    }
  }

  // Variant styles
  &--compact {
    gap: 2px;

    .number-pad__button {
      border-radius: var(--border-radius-s);
    }
  }

  &--rounded {
    .number-pad__button {
      border-radius: 50%;
    }
  }

  &--flat {
    .number-pad__button {
      border: none;
      box-shadow: none;

      &:hover:not(:disabled) {
        box-shadow: none;
      }
    }
  }
}

</style>
