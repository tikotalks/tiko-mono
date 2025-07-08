<!-- TextInput.vue -->
<template>
	
	<InputBase
		v-if="model !== undefined"
		v-model="model"
		:block="block"
		:label="label"
		:pattern="pattern"
		:maxlength="maxlength"
		:minlength="minlength"
		:autofocus="autofocus"
		@change="handleChange"
		@touched="$emit('touched', $event)"
	/>
	<InputBase
		v-else
		:value="value"
		:block="block"
		:label="label"
		:pattern="pattern"
		:maxlength="maxlength"
		:minlength="minlength"
		:autofocus="autofocus"
		@change="$emit('change', $event)"
		@touched="$emit('touched', $event)"
	/>
</template>

<script lang="ts" setup>
import InputBase from './InputBase.vue';

const model = defineModel<string>({
	default: undefined,
});

defineProps({
	value: {
		type: String,
		default: '',
	},
	label: {
		type: String,
		default: '',
	},
	pattern: {
		type: String,
		default: undefined,
	},
	autofocus: {
		type: Boolean,
		default: false,
	},
	maxlength: {
		type: Number,
		default: undefined,
	},
	minlength: {
		type: Number,
		default: undefined,
	}
});

// defineEmits(['change', 'touched']);

const emit = defineEmits<{
	change: [value: string];
	touched: [value: boolean];
}>();

const handleChange = (value: string) => {
	emit('change', value);
};

const block = 'input-text';
</script>

<style lang="scss">
@use 'Form' as form;

.input-text {
	@include form.inputBase();
}
</style>
