<template>
  <div :class="inputClasses">
    <label v-if="label" :for="inputId" :class="bemm('label')">
      {{ label }}
      <span v-if="required" :class="bemm('required')">*</span>
    </label>
    
    <div :class="bemm('wrapper')">
      <TIcon
        v-if="prefixIcon"
        :name="prefixIcon"
        :class="bemm('icon', ['prefix'])"
      />
      
      <input
        :id="inputId"
        :class="bemm('field')"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :min="min"
        :max="max"
        :step="step"
        :aria-label="ariaLabel || label"
        :aria-describedby="descriptionId"
        :aria-invalid="hasError"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />
      
      <TIcon
        v-if="suffixIcon"
        :name="suffixIcon"
        :class="bemm('icon', ['suffix'])"
      />
      
      <div v-if="type === 'number' && showSpinners" :class="bemm('spinners')">
        <button
          type="button"
          :class="bemm('spinner', ['up'])"
          @click="increment"
          :disabled="disabled || (max !== undefined && Number(modelValue) >= max)"
          aria-label="Increase value"
        >
          <TIcon name="chevron-up" size="small" />
        </button>
        
        <button
          type="button"
          :class="bemm('spinner', ['down'])"
          @click="decrement"
          :disabled="disabled || (min !== undefined && Number(modelValue) <= min)"
          aria-label="Decrease value"
        >
          <TIcon name="chevron-down" size="small" />
        </button>
      </div>
    </div>
    
    <div v-if="description || hasError" :id="descriptionId" :class="bemm('description')">
      <span v-if="hasError" :class="bemm('error')">{{ error }}</span>
      <span v-else-if="description" :class="bemm('help')">{{ description }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { useBemm } from 'bemm'
import TIcon from '../TIcon/TIcon.vue'

export interface TInputProps {
  modelValue?: string | number
  type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url'
  label?: string
  placeholder?: string
  description?: string
  error?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  size?: 'small' | 'medium' | 'large'
  prefixIcon?: string
  suffixIcon?: string
  showSpinners?: boolean
  min?: number
  max?: number
  step?: number
  ariaLabel?: string
}

const props = withDefaults(defineProps<TInputProps>(), {
  type: 'text',
  size: 'medium',
  showSpinners: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  enter: [event: KeyboardEvent]
}>()

// BEM classes
const bemm = useBemm('input')

// Generate unique ID
const inputId = computed(() => `input-${Math.random().toString(36).substr(2, 9)}`)
const descriptionId = computed(() => `${inputId.value}-description`)

// State
const isFocused = ref(false)

// Computed
const hasError = computed(() => Boolean(props.error))

const inputClasses = computed(() => {
  return bemm('', {
    [props.size]: true,
    focused: isFocused.value,
    disabled: props.disabled,
    readonly: props.readonly,
    error: hasError.value,
    'has-prefix': Boolean(props.prefixIcon),
    'has-suffix': Boolean(props.suffixIcon),
    'has-spinners': props.type === 'number' && props.showSpinners
  })
})

// Methods
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value: string | number = target.value

  if (props.type === 'number') {
    value = target.value === '' ? '' : Number(target.value)
  }

  emit('update:modelValue', value)
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    emit('enter', event)
  }
}

const increment = () => {
  if (props.disabled || props.readonly) return
  
  const currentValue = Number(props.modelValue) || 0
  const step = props.step || 1
  const newValue = currentValue + step
  
  if (props.max === undefined || newValue <= props.max) {
    emit('update:modelValue', newValue)
  }
}

const decrement = () => {
  if (props.disabled || props.readonly) return
  
  const currentValue = Number(props.modelValue) || 0
  const step = props.step || 1
  const newValue = currentValue - step
  
  if (props.min === undefined || newValue >= props.min) {
    emit('update:modelValue', newValue)
  }
}
</script>

<style lang="scss" scoped>
.input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  &__label {
    font-weight: 500;
    color: var(--text-primary);
    font-size: 0.875rem;
  }
  
  &__required {
    color: var(--color-error);
    margin-left: 0.25rem;
  }
  
  &__wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  &__field {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    font-family: inherit;
    font-size: 1rem;
    line-height: 1.5;
    transition: all 0.2s ease;
    background: var(--bg-primary);
    color: var(--text-primary);
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    &::placeholder {
      color: var(--text-tertiary);
    }
    
    &:disabled {
      background: var(--bg-tertiary);
      color: var(--text-tertiary);
      cursor: not-allowed;
    }
    
    &:readonly {
      background: var(--bg-secondary);
    }
  }
  
  &__icon {
    position: absolute;
    color: var(--text-secondary);
    pointer-events: none;
    
    &--prefix {
      left: 0.75rem;
    }
    
    &--suffix {
      right: 0.75rem;
    }
  }
  
  &__spinners {
    position: absolute;
    right: 0.25rem;
    display: flex;
    flex-direction: column;
    border-radius: var(--radius-sm);
    overflow: hidden;
    border: 1px solid var(--border-primary);
  }
  
  &__spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1rem;
    background: var(--bg-secondary);
    border: none;
    cursor: pointer;
    transition: background-color 0.2s ease;
    
    &:hover:not(:disabled) {
      background: var(--bg-tertiary);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    &--up {
      border-bottom: 1px solid var(--border-primary);
    }
  }
  
  &__description {
    font-size: 0.875rem;
    line-height: 1.4;
  }
  
  &__error {
    color: var(--color-error);
  }
  
  &__help {
    color: var(--text-secondary);
  }
  
  // Size variants
  &--small {
    .input__field {
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
    }
    
    .input__icon--prefix {
      left: 0.5rem;
    }
    
    .input__icon--suffix {
      right: 0.5rem;
    }
  }
  
  &--large {
    .input__field {
      padding: 1rem 1.25rem;
      font-size: 1.125rem;
    }
    
    .input__icon--prefix {
      left: 1rem;
    }
    
    .input__icon--suffix {
      right: 1rem;
    }
  }
  
  // States
  &--has-prefix {
    .input__field {
      padding-left: 2.5rem;
    }
  }
  
  &--has-suffix:not(.input--has-spinners) {
    .input__field {
      padding-right: 2.5rem;
    }
  }
  
  &--has-spinners {
    .input__field {
      padding-right: 2.5rem;
    }
  }
  
  &--error {
    .input__field {
      border-color: var(--color-error);
      
      &:focus {
        border-color: var(--color-error);
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
      }
    }
  }
  
  &--focused {
    .input__icon {
      color: var(--color-primary);
    }
  }
}

// High contrast mode support
@media (prefers-contrast: high) {
  .input {
    &__field {
      border-width: 2px;
    }
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .input {
    &__field {
      transition: none;
    }
  }
}
</style>