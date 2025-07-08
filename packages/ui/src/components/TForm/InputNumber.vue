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
		@change="$emit('change', $event)"
		@touched="$emit('touched', $event)"
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
		@change="$emit('change', $event)"
		@touched="$emit('touched', $event)"
	/>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import InputBase from './InputBase.vue';

const model = defineModel<number>({
	default: undefined,
});

interface Props {
	value?: number;
	label?: string;
	min?: number;
	max?: number;
	step?: number;
}

withDefaults(defineProps<Props>(), {
	value: undefined,
	label: '',
	min: undefined,
	max: undefined,
	step: 1,
});

defineEmits<{
	change: [value: number];
	touched: [value: boolean];
}>();

const block = 'input-number';
const errors = ref<string[]>([]);

const parseValue = (value: string): number | undefined => {
	// Remove any non-digit characters except minus sign and decimal point
	const sanitized = value.replace(/[^\d.-]/g, '');

	// Extract the first number (including decimal and negative)
	const match = sanitized.match(/-?\d+\.?\d*/);
	const firstNumber = match ? match[0] : '';

	// If the input had multiple numbers, show error
	const matches = sanitized.match(/-?\d+\.?\d*/g);
	if (matches && matches.length > 1) {
		errors.value = ['Only one number is allowed'];
	} else {
		errors.value = [];
	}

	const num = firstNumber ? Number(firstNumber) : undefined;
	return num;
};

const formatValue = (value: number | undefined): string => {
	return value?.toString() || '';
};
</script>

<style lang="scss">
@use 'Form' as form;

.input-number {
	@include form.inputBase();

	&--no-controls {
		input {
			appearance: none;
		}
	}
}
</style>
