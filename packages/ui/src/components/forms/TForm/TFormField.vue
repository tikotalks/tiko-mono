<template>
  <div :class="fieldClasses">
    <label v-if="label" :for="inputId" :class="bemm('label')">
      {{ label }}
      <span v-if="required" :class="bemm('required')">*</span>
    </label>

    <div :class="bemm('input')">
      <slot :id="inputId" />
    </div>

    <div v-if="shouldShowDescription || shouldShowError" :class="bemm('info')">
      <p v-if="shouldShowError" :class="bemm('error')">
        {{ computedError }}
      </p>
      <p v-else-if="shouldShowDescription" :class="bemm('description')">
        {{ description }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useBemm } from 'bemm'
import type { FormFieldProps } from './TForm.model'

const props = withDefaults(defineProps<FormFieldProps>(), {
  required: false,
  showError: true
})

const bemm = useBemm('form-field')

// Inject form context
const formContext = inject<any>('formContext', null)

// Generate unique ID
const inputId = computed(() =>
  `field-${props.name}-${Math.random().toString(36).substr(2, 9)}`
)

// Computed
const computedError = computed(() => {
  if (props.error) return props.error
  if (formContext?.errors.value && formContext.errors.value[props.name]) {
    return formContext.errors.value[props.name]
  }
  return null
})

const shouldShowError = computed(() => {
  return props.showError && computedError.value &&
    (formContext?.touched.value?.[props.name] || formContext?.showErrors.value)
})

const shouldShowDescription = computed(() => {
  return props.description && !shouldShowError.value
})

const fieldClasses = computed(() => {
  return bemm('', {
    required: props.required,
    error: shouldShowError.value,
    disabled: formContext?.disabled.value
  })
})
</script>

<style lang="scss">
.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);

  &__label {
    font-weight: 500;
    color: var(--color-foreground);
    font-size: 0.875rem;
  }

  &__required {
    color: var(--color-error);
    margin-left: 0.25rem;
  }

  &__input {
    width: 100%;
  }

  &__info {
    font-size: 0.875rem;
    line-height: 1.4;
  }

  &__error {
    color: var(--color-error);
    margin: 0;
  }

  &__description {
    color: var(--color-text-secondary);
    margin: 0;
  }

  &--error {
    .form-field__label {
      color: var(--color-error);
    }
  }

  &--disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}
</style>
