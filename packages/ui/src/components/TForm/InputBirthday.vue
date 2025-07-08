<template>
	<div :class="bemm()">
		<label
			v-if="props.label"
			:class="bemm('label')"
		>
			{{ props.label }}
		</label>
		<span
			v-if="props.instructions"
			:class="bemm('description')"
		>
			{{ props.instructions }}
		</span>
		<div :class="bemm('controls')">
			<div :class="bemm('column', 'day')">
				<InputText
					v-model="daySearch"
					type="text"
					:class="bemm('input')"
					placeholder="Day"
					:reset="true"
					@focus="dayOptionsActive = true"
					@change="handleDayInput"
					@reset="handleResetDay"
				/>
				<div
					v-if="dayOptionsActive"
					:class="bemm('options')"
				>
					<ul :class="bemm('option-list')">
						<li
							v-for="day in filteredDays"
							:key="day.value"
							:class="
								bemm('option', {
									active: day.value === dayValue,
								})
							"
							@click="selectDay(day)"
						>
							{{ day.label }}
						</li>
					</ul>
				</div>
			</div>
			<div :class="bemm('column', 'month')">
				<InputText
					v-model="monthSearch"
					type="text"
					:class="bemm('input')"
					placeholder="Month"
					:reset="true"
					@focus="monthOptionsActive = true"
					@change="handleMonthInput"
					@reset="handleResetMonth"
				/>
				<div
					v-if="monthOptionsActive"
					:class="bemm('options')"
				>
					<ul :class="bemm('option-list')">
						<li
							v-for="month in filteredMonths"
							:key="month.value"
							:class="
								bemm('option', {
									active: month.value === monthValue,
								})
							"
							@click="selectMonth(month)"
						>
							{{ month.label }}
						</li>
					</ul>
				</div>
			</div>
			<div :class="bemm('column', 'year')">
				<InputText
					v-model="yearSearch"
					type="text"
					:class="bemm('input')"
					placeholder="Year"
					:reset="true"
					@focus="yearOptionsActive = true"
					@change="handleYearInput"
					@reset="handleResetYear"
				/>
				<div
					v-if="yearOptionsActive"
					:class="bemm('options')"
				>
					<VirtualList
						:items="filteredYears"
						:height="160"
						:item-height="32"
						:item-key="(year) => year.value"
					>
						<template #default="{ item }">
							<li
								:class="bemm('option', { active: item.value === yearValue })"
								@click="selectYear(item)"
							>
								{{ item.label }}
							</li>
						</template>
					</VirtualList>
				</div>
			</div>
		</div>
		<div
			v-if="props.error.length"
			:class="bemm('errors')"
		>
			<div
				v-for="err in props.error"
				:key="err"
				:class="bemm('error')"
			>
				{{ err }}
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import InputText from './InputText.vue';
import VirtualList from '@/components/Molecules/VirtualList/VirtualList.vue';
import { useBemm } from '@/utils/bemm';

interface SelectOption {
	label: string;
	value: string;
}

const bemm = useBemm('input-birthday');

const props = defineProps({
	label: {
		type: String,
		default: '',
	},
	modelValue: {
		type: String,
		default: '',
	},
	value: {
		type: String,
		default: '',
	},
	locale: {
		type: String,
		default: 'en-US',
	},
	instructions: {
		type: String,
		default: '',
	},
	error: {
		type: Array as PropType<string[]>,
		default: () => [],
	},
});

const emit = defineEmits(['update:modelValue', 'input', 'reset']);

const yearValue = ref<string | null>(null);
const monthValue = ref<string | null>(null);
const dayValue = ref<string | null>(null);

const yearSearch = ref('');
const monthSearch = ref('');
const daySearch = ref('');

// Get localized month names using Intl

const monthNames = ref<string[]>([]);
const createMonthNames = () => {
	const formatter = new Intl.DateTimeFormat(props.locale, { month: 'long' });
	return Array.from({ length: 12 }, (_, i) => {
		const date = new Date(2000, i, 1);
		return formatter.format(date);
	});
};

const yearOptions = shallowRef<SelectOption[]>([]);
const yearOptionsActive = ref(!props.modelValue && !props.value);
const createYearOptions = (): SelectOption[] => {
	const currentYear = new Date().getFullYear();
	const years: SelectOption[] = [];
	for (let i = currentYear; i >= 1900; i--) {
		years.push({
			label: i.toString(),
			value: i.toString(),
		});
	}
	return years;
};

const monthOptions = shallowRef<SelectOption[]>([]);
const monthOptionsActive = ref(!props.modelValue && !props.value);
const createMonthOptions = (): SelectOption[] => {
	const months: SelectOption[] = [];
	for (let i = 1; i <= 12; i++) {
		months.push({
			label: monthNames.value[i - 1] || '',
			value: i.toString(),
		});
	}
	return months;
};

const dayOptions = shallowRef<SelectOption[]>([]);
const dayOptionsActive = ref(!props.modelValue && !props.value);
const createDayOptions = (): SelectOption[] => {
	const days: SelectOption[] = [];
	for (let i = 1; i <= 31; i++) {
		days.push({
			label: i.toString(),
			value: i.toString(),
		});
	}
	return days;
};

const filteredYears = ref<SelectOption[]>([]);
const createFilteredYears = (): SelectOption[] => {
	if (!yearSearch.value) return yearOptions.value;
	const search = yearSearch.value.toLowerCase();
	return yearOptions.value.filter((year) => year.label.toLowerCase().startsWith(search));
};

const filteredMonths = ref<SelectOption[]>();
const createFilteredMonths = (): SelectOption[] => {
	if (!monthSearch.value) return monthOptions.value;
	const search = monthSearch.value.toLowerCase();
	return [...monthOptions.value.filter((month) => month.label.toLowerCase().startsWith(search))];
};

const filteredDays = ref<SelectOption[]>([]);
const createFilteredDays = (): SelectOption[] => {
	if (!daySearch.value) return dayOptions.value;
	const search = daySearch.value.toLowerCase();
	return [...dayOptions.value.filter((day) => day.label.toLowerCase().startsWith(search))];
};

// Computed date string in YYYY-MM-DD format
const dateString = computed(() => {
	if (!yearValue.value || !monthValue.value || !dayValue.value) return '';

	const year = yearValue.value.padStart(4, '0');
	const month = monthValue.value.padStart(2, '0');
	const day = dayValue.value.padStart(2, '0');

	return `${year}-${month}-${day}`;
});

let lastEmittedDate = '';

watch(dateString, (newValue) => {
	if (newValue !== lastEmittedDate) {
		lastEmittedDate = newValue;
		emit('update:modelValue', newValue);
		emit('input', newValue);
	}
});

const handleResetDay = () => {
	dayValue.value = null;
	daySearch.value = '';
	dayOptionsActive.value = true;
};

const handleResetMonth = () => {
	monthValue.value = null;
	monthSearch.value = '';
	monthOptionsActive.value = true;
};

const handleResetYear = () => {
	yearValue.value = null;
	yearSearch.value = '';
	yearOptionsActive.value = true;
};

// Watch for external value changes
watch(
	() => props.modelValue || props.value,
	(newValue) => {
		const date = new Date(newValue);
		if (isNaN(date.getTime())) {
			dayOptionsActive.value = true;
			monthOptionsActive.value = true;
			yearOptionsActive.value = true;
			return;
		}

		yearValue.value = date.getFullYear().toString();
		monthValue.value = (date.getMonth() + 1).toString();
		dayValue.value = date.getDate().toString();

		yearSearch.value = yearValue.value;
		monthSearch.value = monthNames.value[date.getMonth()] || '';
		daySearch.value = dayValue.value;

		dayOptionsActive.value = false;
		monthOptionsActive.value = false;
		yearOptionsActive.value = false;
	},
	{ immediate: true }
);

const handleYearInput = () => {
	filteredYears.value = createFilteredYears();
	const matches = filteredYears.value;
	if (matches.length === 1) {
		const match = matches[0] as SelectOption;
		selectYear(match);
		yearOptionsActive.value = false;
	}
};

const handleMonthInput = () => {
	filteredMonths.value = createFilteredMonths();
	const matches = filteredMonths.value;
	if (matches.length === 1) {
		const match = matches[0] as SelectOption;
		selectMonth(match);
		monthOptionsActive.value = false;
	}
};

const handleDayInput = () => {
	filteredDays.value = createFilteredDays();
	const matches = filteredDays.value;
	if (matches.length === 1) {
		const match = matches[0] as SelectOption;
		selectDay(match);
		dayOptionsActive.value = false;
	}
};

const selectYear = (year: SelectOption) => {
	yearOptionsActive.value = false;
	yearValue.value = year.value;
	yearSearch.value = year.label;
};

const selectMonth = (month: SelectOption) => {
	monthOptionsActive.value = false;
	monthValue.value = month.value;
	monthSearch.value = month.label;
};

const selectDay = (day: SelectOption) => {
	dayOptionsActive.value = false;
	dayValue.value = day.value;
	daySearch.value = day.label;
};

const initOptions = () => {
	monthNames.value = createMonthNames();
	nextTick();
	yearOptions.value = createYearOptions();
	filteredYears.value = createYearOptions();
	monthOptions.value = createMonthOptions();
	filteredMonths.value = createMonthOptions();
	dayOptions.value = createDayOptions();
	filteredDays.value = createDayOptions();
};

initOptions();
</script>

<style lang="scss">
@use 'Form' as form;

.input-birthday {
	@include form.inputBase();

	&__controls {
		display: flex;
		justify-content: space-between;
		gap: var(--space-s);
		align-items: flex-start;
	}

	&__column {
		border: 1px solid var(--color-accent);
		border-radius: var(--border-radius);
		background-color: var(--color-background);
		flex: 1;
	}

	&__input {
		width: 100%;
		padding: 0;
		border: none;
		background: transparent;
		color: inherit;
		font: inherit;

		--sizing: 0.8;

		&:focus {
			outline: none;
		}
	}

	&__options {
		width: 100%;
		height: fit-content;
		max-height: 10em;

		margin-top: -1em;
		padding-top: 1em;
		border: 1px solid var(--color-accent);
		border-radius: 0 0 var(--border-radius) var(--border-radius);
		scrollbar-color: var(--color-primary) transparent;

		&:not(:has(.virtual-list)) {
			overflow: scroll;
		}
	}

	&__option-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
	}

	&__option {
		padding: var(--space-xs) var(--space);
		font-size: 0.75em;
		cursor: pointer;

		&:hover {
			background-color: var(--color-accent);
		}

		&--active {
			background-color: color-mix(in srgb, var(--color-primary), transparent 50%);

			&:hover {
				background-color: color-mix(in srgb, var(--color-primary), transparent 75%);
			}
		}
	}
}
</style>
