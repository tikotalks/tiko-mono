<template>
  <InputBase
    v-model="model"
    :block="block"
    :label="label"
    :placeholder="placeholder"
    :description="description"
    :instructions="instructions"
    :disabled="disabled"
    :error="error"
    :maxErrors="maxErrors"
    :size="size"
    :status="status"
    :type="type"
    :pattern="pattern"
    :maxlength="maxlength"
    :minlength="minlength"
    :autofocus="autofocus"
    :inputmode="inputmode"
    :reset="reset"
    :controls="controls"
    :autoFocusNext="autoFocusNext"
    @change="handleChange"
    @touched="handleTouched"
    @focus="handleFocus"
    @blur="handleBlur"
    @reset="handleReset"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import InputBase from '../../InputBase.vue'
import type { TInputTextProps } from './TInputText.model'
import { Size, Status } from '../../../../types'

const model = defineModel<string>()

const props = withDefaults(defineProps<TInputTextProps>(), {
  label: '',
  placeholder: '',
  description: '',
  instructions: '',
  disabled: false,
  error: () => [],
  maxErrors: 1,
  size: Size.MEDIUM,
  status: Status.IDLE,
  type: 'text',
  pattern: undefined,
  maxlength: undefined,
  minlength: undefined,
  autofocus: false,
  inputmode: undefined,
  reset: false,
  controls: true,
  autoFocusNext: false
})

const emit = defineEmits<{
  change: [value: string]
  touched: [value: boolean]
  focus: [value: boolean]
  blur: [value: boolean]
  reset: []
}>()

const block = 'input-text'

/**
 * Handle input value change
 */
const handleChange = (value: string) => {
  emit('change', value)
}

/**
 * Handle input touched state
 */
const handleTouched = (touched: boolean) => {
  emit('touched', touched)
}

/**
 * Handle input focus
 */
const handleFocus = (focused: boolean) => {
  emit('focus', focused)
}

/**
 * Handle input blur
 */
const handleBlur = (blurred: boolean) => {
  emit('blur', blurred)
}

/**
 * Handle input reset
 */
const handleReset = () => {
  emit('reset')
}
</script>

<style lang="scss">
@use '../../Form' as form;

.input-text {
  @include form.inputBase();
}
</style>