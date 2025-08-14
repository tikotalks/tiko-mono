<!-- InputDate.vue -->
<template>
	<InputBase
		v-if="model !== undefined"
		v-model="model"
		:block="block"
		:label="label"
		:error="allErrors"
		@change="handleChange"
		@touched="$emit('touched', $event)"
	>
		<template #control="{ id, value: inputValue, disabled, handleInput }">
			<div :class="bemm('wrapper')">
				<input
					:id="`${id}-hidden`"
					ref="hiddenInput"
					:value="inputValue"
					type="date"
					:min="minDate"
					:max="maxDate"
					:disabled="disabled"
					class="visually-hidden"
					@input="handleInput"
				/>
				<input
					:id="id"
					ref="displayInput"
					:value="formatDate(inputValue || '')"
					:class="bemm('control')"
					type="text"
					:disabled="disabled"
					readonly
					@click="openDatePicker"
				/>
			</div>
		</template>
	</InputBase>
	<InputBase
		v-else
		:value="value"
		:block="block"
		:label="label"
		:error="allErrors"
		@change="handleChange"
		@touched="$emit('touched', $event)"
	>
		<template #control="{ id, value: inputValue, disabled, handleInput }">
			<div :class="bemm('wrapper')">
				<input
					:id="`${id}-hidden`"
					ref="hiddenInput"
					:value="inputValue"
					type="date"
					:min="minDate"
					:max="maxDate"
					:disabled="disabled"
					class="visually-hidden"
					@input="
						(e) => {
							handleInput(e);
							emit('change', (e.target as HTMLInputElement).value);
						}
					"
				/>
				<input
					:id="id"
					ref="displayInput"
					:value="formatDate(inputValue || '')"
					:class="bemm('control')"
					type="text"
					:disabled="disabled"
					readonly
					@click="openDatePicker"
				/>
			</div>
		</template>
	</InputBase>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { useBemm } from 'bemm';
import InputBase from './/InputBase.vue';

const model = defineModel<string>({
	default: undefined,
});

interface Props {
	value?: string;
	label?: string;
	error?: string[];
	minDate?: string | Date;
	maxDate?: string | Date;
	disallowPastDates?: boolean;
	disallowFutureDates?: boolean;
	displayFormat?: 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'yyyy-mm-dd' | 'long' | 'short' | 'medium';
	customFormat?: string;
}

const props = withDefaults(defineProps<Props>(), {
	value: '',
	label: '',
	error: () => [],
	minDate: undefined,
	maxDate: undefined,
	disallowPastDates: false,
	disallowFutureDates: false,
	displayFormat: 'yyyy-mm-dd',
	customFormat: undefined,
});

const emit = defineEmits<{
	change: [value: string];
	touched: [value: boolean];
}>();

const block = 'input-date';
const bemm = useBemm(block);
const hiddenInput = ref<HTMLInputElement>();
const displayInput = ref<HTMLInputElement>();

const minDate = computed(() => {
	if (props.minDate) {
		return props.minDate instanceof Date ? props.minDate.toISOString().split('T')[0] : props.minDate;
	}
	if (props.disallowPastDates) {
		return new Date().toISOString().split('T')[0];
	}
	return undefined;
});

const maxDate = computed(() => {
	if (props.maxDate) {
		return props.maxDate instanceof Date ? props.maxDate.toISOString().split('T')[0] : props.maxDate;
	}
	if (props.disallowFutureDates) {
		return new Date().toISOString().split('T')[0];
	}
	return undefined;
});

const blockErrors = ref<string[]>([]);
const allErrors = computed(() => {
	return [...blockErrors.value, ...(props.error || [])];
});

const formatDate = (dateString: string): string => {
	if (!dateString) return '';

	try {
		const date = new Date(dateString);

		if (props.customFormat) {
			let formatted = props.customFormat;
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');

			formatted = formatted.replace('yyyy', year.toString());
			formatted = formatted.replace('mm', month);
			formatted = formatted.replace('dd', day);

			return formatted;
		}

		switch (props.displayFormat) {
			case 'yyyy-mm-dd':
				return dateString;
			case 'dd/mm/yyyy':
				return date.toLocaleDateString('en-GB');
			case 'mm/dd/yyyy':
				return date.toLocaleDateString('en-US');
			case 'dd-mm-yyyy':
				return date.toLocaleDateString('en-GB').replace(/\//g, '-');
			case 'mm-dd-yyyy':
				return date.toLocaleDateString('en-US').replace(/\//g, '-');
			case 'long':
				return date.toLocaleDateString(undefined, {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric',
				});
			case 'short':
				return date.toLocaleDateString(undefined, {
					month: 'short',
					day: 'numeric',
					year: 'numeric',
				});
			case 'medium':
				return date.toLocaleDateString(undefined, {
					month: 'long',
					day: 'numeric',
					year: 'numeric',
				});
			default:
				return date.toLocaleDateString();
		}
	} catch {
		return dateString;
	}
};

const validateDate = (value: string) => {
	blockErrors.value = [];

	if (!value) return;

	const selectedDate = new Date(value);
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	if (props.disallowPastDates && selectedDate < today) {
		blockErrors.value.push('Please select a future date');
	}

	if (props.disallowFutureDates && selectedDate > today) {
		blockErrors.value.push('Please select a past date');
	}

	if (props.minDate && new Date(value) < new Date(props.minDate)) {
		blockErrors.value.push(`Date must be after ${formatDate(props.minDate.toString())}`);
	}

	if (props.maxDate && new Date(value) > new Date(props.maxDate)) {
		blockErrors.value.push(`Date must be before ${formatDate(props.maxDate.toString())}`);
	}
};

const handleChange = (value: string) => {
	validateDate(value);
	emit('change', value);
};

const openDatePicker = () => {
	hiddenInput.value?.showPicker();
};

watch(
	() => model.value ?? props.value,
	(newValue) => {
		if (newValue) validateDate(newValue);
	}
);
</script>

<style lang="scss">
@use 'Form' as form;

.input-date {
	@include form.inputBase();

	&__wrapper {
		position: relative;
		width: 100%;
	}

	&__control {
		width: 100%;
		cursor: pointer;
	}
}

.visually-hidden {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
}
</style>
