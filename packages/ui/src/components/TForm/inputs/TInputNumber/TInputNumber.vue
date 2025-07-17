<!-- InputNumber.vue -->
<template>
	<InputBase
		v-if="model !== undefined"
		v-model="model"
		:block="block"
		:label="label"
		type="text"
		:min="min"
		:max="max"
		:step="step"
		:parse-value="parseValue"
		:format-value="formatValue"
		:error="errors"
		@change="emit('change', $event)"
		@touched="emit('touched', $event)"
	/>
	<InputBase
		v-else
		:value="value"
		:block="block"
		:label="label"
		type="text"
		:min="min"
		:max="max"
		:step="step"
		:parse-value="parseValue"
		:format-value="formatValue"
		:error="errors"
		@change="emit('change', $event)"
		@touched="emit('touched', $event)"
	/>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import InputBase from '../../InputBase.vue'
import type { TInputNumberProps, TInputNumberEmits } from './TInputNumber.model'
import { parseNumericValue, formatNumericValue } from './TInputNumber.model'

const model = defineModel<number>({
	default: undefined,
})

const props = withDefaults(defineProps<TInputNumberProps>(), {
	label: '',
	step: 1,
	disabled: false,
	controls: true,
	formatThousands: false
})

const emit = defineEmits<TInputNumberEmits>()

const block = 'input-number';
const errors = ref<string[]>([]);

const parseValue = (value: string): number | undefined => {
	const parsed = parseNumericValue(value, props.decimals)
	
	// Check for multiple numbers in input
	const matches = value.replace(/[^\d.-]/g, '').match(/-?\d+\.?\d*/g)
	if (matches && matches.length > 1) {
		errors.value = ['Only one number is allowed']
	} else {
		errors.value = []
	}
	
	return parsed
}

const formatValue = (value: number | undefined): string => {
	return formatNumericValue(value, props.decimals, props.formatThousands)
}
</script>

<style lang="scss">
@use '../../Form' as form;

.input-number {
	@include form.inputBase();

	&--no-controls {
		input {
			appearance: none;
		}
	}
}
</style>
