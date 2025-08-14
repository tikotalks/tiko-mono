<template>
	<div :class="bemm()">
		<label
			v-if="label"
			:class="bemm('label')"
		>
			{{ label }}
		</label>

		<div :class="bemm('control-container')">
			<input
				v-model="model"
				style="width: 60px"
				type="number"
				:class="bemm('value')"
				:min="min"
				:max="max"
				:step="step"
				@input="emit('update:modelValue', numberModel)"
			/>
			<input
				v-model="model"
				:class="bemm('control')"
				:placeholder="placeholder"
				type="range"
				:min="min"
				:max="max"
				:step="step"
				@input="emit('update:modelValue', numberModel)"
			/>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useBemm } from 'bemm';

const bemm = useBemm('input-range');

const model = defineModel<number | string>();
const emit = defineEmits(['update:modelValue']);

defineProps({
	label: {
		type: String,
		default: '',
	},
	placeholder: {
		type: String,
		default: '',
	},
	min: {
		type: Number,
		default: 0,
	},
	max: {
		type: Number,
		default: 100,
	},
	step: {
		type: Number,
		default: 1,
	},
});
const numberModel = computed(() => {
	if (typeof model.value == 'string') return parseInt(model.value);
	return model.value;
});
</script>

<style lang="scss">
@use 'Form' as form;

.input-range {
	@include form.inputRange();
}
</style>
