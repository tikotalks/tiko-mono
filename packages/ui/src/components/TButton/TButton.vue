<template>
  <component
    :is="to ? 'a' : element"
    :href="to || href"
    :class="blockClasses"
    :disabled="isDisabled"
    :type="htmlButtonType === 'auto' ? 'button' : htmlButtonType"
    :style="buttonStyles"
    v-bind="$attrs"
  >
    <div :class="bemm('container', ['', reverse ? 'direction-reverse' : ''])">
      <span v-if="icon" :class="bemm('icon')">
        <TIcon :name="icon" />
        <TIcon v-if="hoverIcon" :name="hoverIcon" />
      </span>
      <span v-if="hasSlot && type !== ButtonType.ICON_ONLY" :class="bemm('text')">
        <slot />
      </span>
    </div>
    <div v-if="status !== ButtonStatus.IDLE" :class="bemm('status')">
      <span v-if="status === ButtonStatus.LOADING">Loading...</span>
      <TIcon
        v-if="status === ButtonStatus.SUCCESS || status === ButtonStatus.SUCCESS_ALT"
        name="check"
      />
      <TIcon
        v-if="status === ButtonStatus.ERROR || status === ButtonStatus.ERROR_ALT"
        name="x"
      />
    </div>
    <span
      v-if="count && count > -1"
      :class="bemm('count')"
    >
      {{ count }}
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed, useSlots, ref, watch } from 'vue'
import { useBemm } from 'bemm'
import { TIcon } from '../TIcon'
import { ButtonType, ButtonSize, ButtonColor, ButtonStatus, type TButtonProps } from './TButton.model'

const props = withDefaults(defineProps<TButtonProps>(), {
  icon: '',
  hoverIcon: '',
  size: ButtonSize.MEDIUM,
  type: ButtonType.DEFAULT,
  color: ButtonColor.PRIMARY,
  count: -1,
  disabled: false,
  to: '',
  href: '',
  element: 'button',
  tooltip: '',
  shadow: false,
  htmlButtonType: 'auto',
  hideLabel: 'none',
  status: ButtonStatus.IDLE,
  reverse: false
})

const bemm = useBemm('button')
const slots = useSlots()

const blockClasses = computed(() => {
  const classes = [bemm()]

  if (props.icon) {
    classes.push(bemm('', 'has-icon'))
  }
  classes.push(bemm('', props.size))
  classes.push(bemm('', props.type))
  classes.push(bemm('', props.color))
  classes.push(bemm('', props.variant))

  if (!hasSlot.value && props.icon) {
    classes.push(bemm('', 'icon-only'))
  }

  if (hasSlot.value && props.icon) {
    classes.push(bemm('', 'text-icon'))
  }

  if (props.status !== ButtonStatus.IDLE) {
    classes.push(bemm('', `status-${props.status}`))
  }

  return classes
})

const isDisabled = ref(props.disabled)
watch(
  () => props.disabled,
  (newValue) => {
    isDisabled.value = newValue
  },
  { immediate: true }
)

const hasSlot = computed(() => !!slots?.default)

const buttonStyles = computed(() => {
  if(props.type == ButtonType.GHOST){
    return {
      '--button-color': `var(--color-${props.color})`,
    }
  }
  return {
    '--button-color': `var(--color-${props.color})`,
    '--button-color-text': `var(--color-${props.color}-text)`
  }
})
</script>

<style lang="scss" scoped>
/**
 * TButton component styles following Tiko design system standards
 * - Uses em units and CSS custom properties for spacing
 * - Uses semantic colors for theming
 * - Uses flex + gap for layout instead of margins
 * - Follows BEM methodology
 */
.button {
  // Base semantic color variables
  --button-color: var(--color-primary);
  --button-color-text: var(--color-primary-text);
  --button-color-border: var(--color-primary);
  --button-background: var(--button-color);

  // Component styles
  position: relative;
  width: fit-content;
  display: inline-flex;
  color: var(--button-color-text);
  background-color: transparent;
  border: none;
  white-space: nowrap;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;

  // Button type variants
  &--default {
    --button-background: var(--button-color);

    &:hover:not(:disabled) {
      opacity: 0.9;
    }
  }

  &--ghost {
    --button-background: transparent;
    --button-color-border: transparent;
    --button-color-text: var(--button-color);

    &:hover:not(:disabled) {
      --button-background: color-mix(in srgb, var(--button-color), transparent 90%);
    }
  }

  &--outline {
    --button-background: transparent;
    --button-color-text: var(--button-color);

    &:hover:not(:disabled) {
      --button-background: var(--button-color);
      --button-color-text: var(--color-background);
    }
  }


  // Background pseudo-element
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: var(--button-background);
    border-radius: var(--border-radius, 0.5em);
    transition: all 0.2s ease;
    z-index: 0;
  }

  // Interactive states
  &:disabled {
    opacity: 0.5;
    pointer-events: none;
    cursor: not-allowed;
  }

  &:focus {
    outline: 2px solid var(--button-color);
    outline-offset: 2px;
  }

  // Container for content
  &__container {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs, 0.5em);

    &--direction-reverse {
      flex-direction: row-reverse;
    }
  }

  // Size variants using design system spacing
  &--small {
    .button__container {
      padding: var(--space-xs, 0.5em) var(--space-s, 0.75em);
      font-size: 0.875em;
    }
  }

  &--medium {
    .button__container {
      padding: var(--space-s, 0.75em) var(--space, 1em);
      font-size: 1em;
    }
  }

  &--large {
    .button__container {
      padding: var(--space, 1em) var(--space-lg, 1.25em);
      font-size: 1.125em;
    }
  }

  &--icon-only {
    .button__container {
      padding: var(--space-s, 0.75em);
      aspect-ratio: 1;
    }
  }

  // Content elements
  &__text {
    display: flex;
    align-items: center;
  }

  &__icon {
    display: flex;
    align-items: center;
    font-size: 1.25em;
  }

  // Badge count
  &__count {
    position: absolute;
    right: calc(-1 * var(--space-xs, 0.5em));
    top: calc(-1 * var(--space-xs, 0.5em));
    background: var(--color-error);
    color: var(--color-error-text, var(--color-background));
    border-radius: 50%;
    min-width: 1.25em;
    height: 1.25em;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75em;
    font-weight: 600;
  }

  // Status overlay
  &__status {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--button-background);
    border-radius: var(--border-radius, 0.5em);
    z-index: 2;
  }
}
</style>
