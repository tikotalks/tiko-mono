<template>
	<!-- <TabGroup :class="inputClasses">
		<Tab
			v-for="(v, idx) in formattedValues"
			:key="idx"
			:class="bemm('option', ['', v.label])"
			:size="ButtonSettings.Size.SMALL"
			:color="internalValue === v.value ? ButtonSettings.Color.PRIMARY : ButtonSettings.Color.ACCENT"
			:icon="v.icon"
			:active="internalValue === v.value"
			@click="handleClick(v.value)"
		>
			{{ v.label }}

			<span
				v-if="v.count"
				:class="bemm('option-count')"
			>
				{{ v.count }}
			</span>
		</Tab>
		<label
			v-if="label"
			for="test"
			:class="bemm('label')"
		>
			{{ label }}
		</label>
	</TabGroup> -->
</template>

<script lang="ts" setup>
import { type PropType, computed } from 'vue';
import { useBemm } from 'bemm';

import Button from '../TButton/TButton.vue';

import { ButtonSettings } from '../TButton/TButton.model';
import { type SwitchOption } from './InputSwitch.model';
import { Size } from '../../types';
// import TabGroup from '../Tab/TabGroup.vue';
// import Tab from '../Tab/Tab.vue';

const bemm = useBemm('input-switch');

const props = defineProps({
	label: {
		type: String,
		default: '',
	},
	options: {
		type: Array as PropType<string[] | SwitchOption[]>,
		default: () => [],
	},
	value: {
		type: String as PropType<string | number | boolean>,
		default: '',
	},
	size: {
		type: String as PropType<Size>,
		default: Size.MEDIUM,
	},
});

onMounted(() => {
	if (props.options.length === 0) {
		console.warn('InputSwitch: No options provided');
	}
});

const modelValue = defineModel({
	type: String as PropType<string | number | boolean>,
});
const emit = defineEmits(['update:modelValue', 'change']);
const internalValue = ref(props.value || modelValue.value);
const emitChange = () => {
	emit('change', internalValue.value);
	emit('update:modelValue', internalValue.value);
};

watch(
	() => props.value,
	(newValue) => {
		internalValue.value = newValue;
	}
);

watch(
	() => modelValue.value,
	(newValue) => {
		internalValue.value = newValue;
	}
);

const formattedValues = computed<SwitchOption[]>(() => {
	if (typeof props.options[0] == 'string') {
		return props.options.map((v) => {
			return {
				label: v,
				value: v,
				icon: null,
			} as SwitchOption;
		});
	} else if (typeof props.options[0] == 'object' && props.options[0].value && props.options[0].label) {
		return props.options as SwitchOption[];
	} else {
		return [];
	}
});

const handleClick = (value: string | number | boolean) => {
	internalValue.value = value;
	emit('update:modelValue', value);
	emitChange();
};

const inputClasses = computed(() => {
	return [bemm(), bemm('', props.size)];
});
</script>

<style lang="scss">
@use 'Form' as form;

.input-switch {
	@include form.inputSwitch();
}
</style>
