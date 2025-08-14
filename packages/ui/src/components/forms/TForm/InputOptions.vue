<template>
	<div class="input-options">
		<InputCheckbox
			v-for="option in options"
			:id="createCheckboxId(option.value)"
			:key="option.value"
			v-model="optionStates[option.value]"
			:label="option.label"
			@update:model-value="(checked, event) => updateValues(option.value, checked, event)"
		/>
	</div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, PropType, useId } from 'vue';
import InputCheckbox from './InputCheckboxSwitch.vue';
import { Icons } from 'open-icon';

interface Option {
	label: string;
	icon: Icons;
	value: string | number;
}

const props = defineProps({
	options: {
		type: Array as PropType<Option[]>,
		required: true,
	},
	value: {
		type: Array as PropType<(string | number)[]>,
		default: () => [],
	},
	id: {
		type: String,
		default: '',
	},
	multi: {
		type: Boolean,
		default: true,
	},
});

const emit = defineEmits<{
	'update:modelValue': [(string | number)[]];
	'change': [(string | number)[], Event?];
}>();

// Internal state mirroring the v-model value
const selectedValues = ref<(string | number)[]>([...props.value]);

// Keep selectedValues in sync with external modelValue changes
watch(
	() => props.value,
	(newVal) => {
		selectedValues.value = [...newVal];
	},
	{ immediate: true, deep: true }
);

// Generate checkbox states from selected values
const optionStates = computed(() => {
	const states: Record<string | number, boolean> = {};
	props.options.forEach((option) => {
		states[option.value] = selectedValues.value.includes(option.value);
	});
	return states;
});

// Emit updated value on checkbox interaction
const updateValues = (value: string | number, checked: boolean, event?: Event) => {
	if (props.multi) {
		if (checked && !selectedValues.value.includes(value)) {
			selectedValues.value.push(value);
		} else if (!checked) {
			selectedValues.value = selectedValues.value.filter(v => v !== value);
		}
	} else {
		selectedValues.value = checked ? [value] : [];
	}

	emit('update:modelValue', [...selectedValues.value]);
	emit('change', [...selectedValues.value], event);
};

// Generate unique ID per option
const baseId = useId();
const createCheckboxId = (suffix: string | number) => {
	return props.id ? `${props.id}-${suffix}` : `${baseId}-${suffix}`;
};
</script>

<style lang="scss" scoped>
.input-options {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}
</style>
