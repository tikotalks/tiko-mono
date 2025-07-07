<template>
  <component
    :is="componentTag"
    :class="buttonClasses"
    :disabled="disabled || loading"
    :type="componentTag === 'button' ? htmlType : undefined"
    :to="componentTag === 'router-link' ? to : undefined"
    :aria-label="ariaLabel || label"
    :aria-describedby="ariaDescribedBy"
    :aria-pressed="status === 'success' ? 'true' : undefined"
    @click="handleClick"
    @pointerdown="handlePointerDown"
    @pointerup="handlePointerUp"
    @pointerleave="handlePointerUp"
    @keydown="handleKeydown"
  >
    <TIcon
      v-if="showLeftIcon"
      :name="leftIconName"
      :size="iconSize"
      :class="bemm('icon', ['left'])"
      aria-hidden="true"
    />
    
    <span v-if="hasLabel" :class="bemm('label')">
      <slot>{{ label }}</slot>
    </span>
    
    <TIcon
      v-if="showRightIcon"
      :name="rightIconName"
      :size="iconSize"
      :class="bemm('icon', ['right'])"
      aria-hidden="true"
    />
    
    <div v-if="loading" :class="bemm('spinner')" aria-hidden="true">
      <TIcon name="loader" :size="iconSize" />
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, reactive, ref, useSlots } from 'vue'
import { useBemm } from 'bemm'
import { TButtonProps, LongPressState } from './TButton.model'
import TIcon from '../TIcon/TIcon.vue'

// Props with defaults
const props = withDefaults(defineProps<TButtonProps>(), {
  type: 'default',
  size: 'medium',
  color: 'primary',
  status: 'idle',
  htmlType: 'button',
  iconPosition: 'left',
  longPressTime: 500,
  vibrate: true
})

// Emits
const emit = defineEmits<{
  click: [event: Event]
  longPress: []
}>()

// BEM classes
const bemm = useBemm('button')

// Long press state
const longPressState = reactive<LongPressState>({
  isPressed: false,
  timer: null,
  startTime: 0
})

// Component tag logic
const componentTag = computed(() => {
  return props.to ? 'router-link' : 'button'
})

// Icon logic
const slots = useSlots()
const hasLabel = computed(() => Boolean(props.label || slots.default))
const showLeftIcon = computed(() => props.icon && props.iconPosition === 'left')
const showRightIcon = computed(() => props.icon && props.iconPosition === 'right')

const leftIconName = computed(() => {
  if (props.status === 'success') return 'check'
  if (props.status === 'error') return 'x'
  return props.icon || ''
})

const rightIconName = computed(() => {
  if (props.status === 'success') return 'check'
  if (props.status === 'error') return 'x'
  return props.icon || ''
})

const iconSize = computed(() => {
  const sizeMap = {
    small: 'small',
    medium: 'medium',
    large: 'large'
  }
  return sizeMap[props.size]
})

// Button classes
const buttonClasses = computed(() => {
  return bemm('', {
    [props.type]: true,
    [props.size]: true,
    [props.color]: true,
    [props.status]: true,
    disabled: props.disabled,
    loading: props.loading,
    'has-icon': Boolean(props.icon),
    'icon-only': Boolean(props.icon) && !hasLabel.value,
    'is-pressed': longPressState.isPressed
  })
})

// Event handlers
const handleClick = (event: Event) => {
  if (props.disabled || props.loading) return
  
  emit('click', event)
  props.action?.()
}

const handlePointerDown = (event: PointerEvent) => {
  if (props.disabled || props.loading || !props.onLongPress) return
  
  longPressState.isPressed = true
  longPressState.startTime = Date.now()
  
  longPressState.timer = window.setTimeout(() => {
    if (longPressState.isPressed) {
      // Vibrate if supported and enabled
      if (props.vibrate && 'vibrate' in navigator) {
        navigator.vibrate(50)
      }
      
      emit('longPress')
      props.onLongPress?.()
    }
  }, props.longPressTime)
}

const handlePointerUp = () => {
  longPressState.isPressed = false
  
  if (longPressState.timer) {
    clearTimeout(longPressState.timer)
    longPressState.timer = null
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  // Handle Enter and Space keys for accessibility
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleClick(event)
  }
}

// Cleanup on unmount
import { onUnmounted } from 'vue'

onUnmounted(() => {
  if (longPressState.timer) {
    clearTimeout(longPressState.timer)
  }
})
</script>

<style lang="scss" scoped>
.button {
  // Base styles
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-family: inherit;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  
  // Focus styles
  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
  
  // Elements
  &__label {
    flex: 1;
    text-align: center;
  }
  
  &__icon {
    flex-shrink: 0;
    
    &--left {
      margin-right: -0.25rem;
    }
    
    &--right {
      margin-left: -0.25rem;
    }
  }
  
  &__spinner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: spin 1s linear infinite;
  }
  
  // Sizes
  &--small {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
  
  &--medium {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }
  
  &--large {
    padding: 1rem 2rem;
    font-size: 1.125rem;
  }
  
  // Types
  &--default {
    background: var(--button-bg, #3b82f6);
    color: var(--button-color, white);
    
    &:hover:not(:disabled) {
      background: var(--button-bg-hover, #2563eb);
    }
    
    &:active {
      background: var(--button-bg-active, #1d4ed8);
    }
  }
  
  &--ghost {
    background: transparent;
    color: var(--button-color, #3b82f6);
    border: 1px solid currentColor;
    
    &:hover:not(:disabled) {
      background: var(--button-bg-hover, rgba(59, 130, 246, 0.1));
    }
  }
  
  &--fancy {
    background: linear-gradient(135deg, var(--button-bg, #3b82f6), var(--button-bg-secondary, #8b5cf6));
    color: var(--button-color, white);
    box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.39);
    
    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px 0 rgba(59, 130, 246, 0.5);
    }
  }
  
  // Colors
  &--primary {
    --button-bg: #3b82f6;
    --button-bg-hover: #2563eb;
    --button-bg-active: #1d4ed8;
    --button-color: white;
  }
  
  &--success {
    --button-bg: #10b981;
    --button-bg-hover: #059669;
    --button-bg-active: #047857;
    --button-color: white;
  }
  
  &--error {
    --button-bg: #ef4444;
    --button-bg-hover: #dc2626;
    --button-bg-active: #b91c1c;
    --button-color: white;
  }
  
  // States
  &--loading {
    .button__label,
    .button__icon {
      opacity: 0;
    }
  }
  
  &--success {
    --button-bg: #10b981;
  }
  
  &--error {
    --button-bg: #ef4444;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
  
  &--is-pressed {
    transform: scale(0.98);
  }
  
  // Icon only buttons
  &--icon-only {
    padding: 0.75rem;
    
    &.button--small {
      padding: 0.5rem;
    }
    
    &.button--large {
      padding: 1rem;
    }
  }
}

@keyframes spin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

// High contrast mode support
@media (prefers-contrast: high) {
  .button {
    border: 2px solid currentColor;
    
    &--ghost {
      border-width: 2px;
    }
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .button {
    transition: none;
    
    &:hover:not(:disabled) {
      transform: none;
    }
    
    .button__spinner {
      animation: none;
    }
  }
}
</style>