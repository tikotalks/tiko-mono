<template>
  <form
    :id="id"
    :name="name"
    :method="method"
    :action="action"
    :class="formClasses"
    @submit="handleSubmit"
    @reset="handleReset"
  >
    <slot v-bind="slotProps" />
  </form>
</template>

<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { useBemm } from 'bemm'
import type { TFormProps, TFormEmits } from './TForm.model'

const props = withDefaults(defineProps<TFormProps>(), {
  disabled: false,
  loading: false,
  method: 'post',
  preventDefault: true,
  validationMode: 'onSubmit',
  showErrors: true
})

const emit = defineEmits<TFormEmits>()

const bemm = useBemm('form')

// Form state
const errors = ref<Record<string, string>>({})
const touched = ref<Record<string, boolean>>({})
const isSubmitting = ref(false)

// Provide form context to child components
provide('formContext', {
  disabled: computed(() => props.disabled),
  loading: computed(() => props.loading),
  validationMode: computed(() => props.validationMode),
  showErrors: computed(() => props.showErrors),
  errors,
  touched,
  setError: (field: string, error: string) => {
    errors.value[field] = error
  },
  clearError: (field: string) => {
    delete errors.value[field]
  },
  setTouched: (field: string) => {
    touched.value[field] = true
  }
})

// Computed
const isValid = computed(() => Object.keys(errors.value).length === 0)

const formClasses = computed(() => {
  return bemm('', {
    disabled: props.disabled,
    loading: props.loading,
    invalid: !isValid.value,
    submitting: isSubmitting.value
  })
})

const slotProps = computed(() => ({
  isValid: isValid.value,
  errors: errors.value,
  submit: submit,
  reset: reset
}))

// Methods
const handleSubmit = async (event: Event) => {
  if (props.preventDefault) {
    event.preventDefault()
  }

  if (props.disabled || props.loading) {
    return
  }

  isSubmitting.value = true

  try {
    // Validate all fields
    if (props.validationMode === 'onSubmit') {
      // Validation logic would go here
    }

    if (!isValid.value) {
      emit('validation-error', errors.value)
      return
    }

    const formData = new FormData(event.target as HTMLFormElement)
    emit('submit', event, formData)
  } finally {
    isSubmitting.value = false
  }
}

const handleReset = (event: Event) => {
  errors.value = {}
  touched.value = {}
  emit('reset')
}

const submit = () => {
  const form = document.getElementById(props.id!) as HTMLFormElement
  form?.requestSubmit()
}

const reset = () => {
  const form = document.getElementById(props.id!) as HTMLFormElement
  form?.reset()
}
</script>

<style lang="scss">
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space);
  width: 100%;

  &--disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  &--loading {
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
