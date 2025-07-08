// InputDate.vue
<template>
	<div :class="inputClasses">
		<label
			v-if="label"
			:for="ids.id"
			:class="bemm('label')"
		>
			{{ label }}
		</label>
		<div
			v-if="description"
			:class="bemm('description')"
		>
			{{ description }}
		</div>
		<div :class="bemm('control-container')">
			<input
				:id="ids.id"
				ref="control"
				v-model="displayValue"
				:class="bemm('control')"
				:placeholder="placeholder"
				type="text"
				:disabled="disabled"
				readonly
				@click="openDatePicker"
			/>
			<Button
				:class="bemm('calendar-button')"
				:icon="Icons.CALENDAR"
				:type="ButtonSettings.Type.ICON_ONLY"
				@click="openDatePicker"
			/>
		</div>
		<span
			v-if="instructions"
			:id="ids.describedBy"
			:class="bemm('instructions')"
		>
			{{ instructions }}
		</span>
		<div
			v-if="error.length"
			:class="bemm('errors')"
		>
			<div
				v-for="err in error"
				:key="err"
				:class="bemm('error')"
			>
				{{ err }}
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { useBemm } from 'bemm';
import { ref, reactive, onMounted, watch, defineProps, defineModel, computed, type PropType } from 'vue';
import { DefaultDatePickerOptions, type DatePickerOptions } from './DatePicker/DatePicker.model';
import DatePicker from './DatePicker/DatePicker.vue';
import { eventBus, EventAction, EventChannel, type EventData } from '@/utils/eventBus';
import { Icons, Size } from '@/types';
import { popupService } from '@/components/Molecules/Popup/Popup.service';
import { ButtonSettings } from '@/components/Atoms/Button/Button.model';
import Button from '@/components/Atoms/Button/Button.vue';

const block = 'input-calendar';
const bemm = useBemm(block);
const control = ref();

const props = defineProps({
	label: {
		type: String,
		default: '',
	},
	placeholder: {
		type: String,
		default: '',
	},
	id: {
		type: String,
		default: '',
	},
	describedBy: {
		type: String,
		default: '',
	},
	description: {
		type: String,
		default: '',
	},
	instructions: {
		type: String,
		default: '',
	},
	disabled: {
		type: Boolean,
		default: false,
	},
	error: {
		type: Array as PropType<string[]>,
		default: () => [],
	},
	dateFormat: {
		type: String,
		default: 'YYYY-DD-MM',
	},
	size: {
		type: String as PropType<Size>,
		default: Size.MEDIUM,
	},
	availableDates: {
		type: Array as PropType<([Date, Date] | Date)[]>,
		default: () => [],
	},
	options: {
		type: Object as PropType<Partial<DatePickerOptions>>,
		default: () => {},
	},
});

const optionsGroup = ref({});
watch(
	() => props.options,
	(newValue) => {
		optionsGroup.value = { ...DefaultDatePickerOptions, ...newValue };
	},
	{ immediate: true, deep: true }
);

const modelValue = defineModel<Date | null>();

const emit = defineEmits(['update:modelValue', 'change']);
const internalValue = ref(modelValue.value || '');
const displayValue = computed(() => {
	if (!internalValue.value) return '';
	// Format the date here based on props.dateFormat
	return new Date(internalValue.value).toLocaleDateString();
});

const datePickerId = computed(() => {
	return props.id + '-date-picker';
});

const openDatePicker = () => {
	if (props.disabled) return;

	popupService.showPopup({
		component: DatePicker,
		id: datePickerId.value,
		props: {
			id: datePickerId.value,
			selectedDate: internalValue.value,
			options: optionsGroup.value,
		},
	});
};

onMounted(() => {
	// Listen for date selection from the DatePicker
	eventBus.on(EventChannel.FORM, (p: any) => {
		const payload = p as EventData;
		if (payload.action == EventAction.UPDATE) {
			if (payload.data.id === datePickerId.value) {
				setValue(payload.data.date);
			}
		}
	});
});

const setValue = (value: string) => {
	internalValue.value = value;
	emit('update:modelValue', value);
	emit('change', value);
};

watch(
	() => modelValue.value,
	(newValue) => {
		internalValue.value = newValue || '';
	}
);

const ids = reactive({
	id: props.id || `${block}-${useId()}`,
	describedBy: props.describedBy || `${block}-${useId()}-description`,
});

const inputClasses = computed(() => {
	return [bemm(), bemm('', props.size)];
});
</script>

<style lang="scss">
.input-calendar {
	&__control-container {
		display: flex;
		align-items: center;
	}

	&__calendar-button {
		margin-left: 0.5rem;
	}
}
</style>
