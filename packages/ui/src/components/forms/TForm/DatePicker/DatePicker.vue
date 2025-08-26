<template>
	<div :class="bemm()">
		<div :class="bemm('header')">
			<Button
				:class="bemm('nav-button')"
				:icon="Icons.CHEVRON_LEFT"
				:iconOnly="true"
				:size="ButtonSettings.Size.SMALL"
				:type="ButtonSettings.Type.DEFAULT"
				@click="previousMonth"
			/>
			<span>{{ currentMonthYear }}</span>
			<Button
				:class="bemm('nav-button')"
				:icon="Icons.CHEVRON_RIGHT"
				:iconOnly="true"
				:size="ButtonSettings.Size.SMALL"
				:type="ButtonSettings.Type.DEFAULT"
				@click="nextMonth"
			/>
		</div>

		<div :class="bemm('weekdays')">
			<div
				v-for="day in weekDays"
				:key="day"
				:class="bemm('weekday')"
			>
				{{ day }}
			</div>
		</div>
		<div :class="bemm('days')">
			<div
				v-for="{ date, isCurrentMonth, isToday: isTodayValue, isSelected, isAvailable } in calendarDays"
				:key="date.toISOString()"
				:class="[
					bemm('day', {
						'': true,
						'current-month': isCurrentMonth,
						'today': isTodayValue,
						'selected': isSelected,
						'unavailable': !isAvailable,
					}),
				]"
				@click="selectDate(date)"
			>
				{{ date.getDate() }}
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { ref, computed, type PropType } from 'vue';
import { useBemm } from 'bemm';
import { findFirstAvailableDate, getWeekDays, isAvailableDate, isSelectedDate, isToday } from './DatePicker.utils';
import type { DatePickerOptions } from './DatePicker.model';
import { ButtonSettings } from '@/components/Atoms/Button/Button.model';
import { eventBus } from '@/utils';
import { EventAction, EventChannel, type EventData } from '@/utils/eventBus';
import { Icons } from '@/types';
import Button from '@/components/Atoms/Button/Button.vue';
import { popupService } from '@/components/Molecules/Popup/Popup.service';

interface DayInfo {
	date: Date;
	isCurrentMonth: boolean;
	isToday: boolean;
	isSelected: boolean;
	isAvailable: boolean;
}

const block = 'date-picker';
const bemm = useBemm(block);

const props = defineProps({
	id: {
		type: String,
		default: '',
	},
	selectedDate: {
		type: String,
		default: '',
	},
	options: {
		type: Object as PropType<DatePickerOptions>,
		default: () => {},
	},
});

const currentDate = ref(props.selectedDate ? new Date(props.selectedDate) : new Date());
const selectedDate = ref(props.selectedDate ? new Date(props.selectedDate) : null);

const weekDays = ref(getWeekDays({ locale: props.options.locale }));

onMounted(() => {
	if (props.options.availableDates && props.options.navigateToFirstAvailableDate) {
		const firstAvailable = findFirstAvailableDate(props.options.availableDates, new Date());
		if (firstAvailable) {
			currentDate.value = firstAvailable;
		}
	}
});

const currentMonthYear = computed(() => {
	return currentDate.value.toLocaleDateString(props.options.locale, {
		month: 'long',
		year: 'numeric',
	});
});

const calendarDays = computed((): DayInfo[] => {
	const year = currentDate.value.getFullYear();
	const month = currentDate.value.getMonth();
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);
	const days: DayInfo[] = [];

	// Add previous month's days
	const prevMonthDays = firstDay.getDay();
	for (let i = prevMonthDays - 1; i >= 0; i--) {
		const date = new Date(year, month, -i);
		days.push({
			date,
			isCurrentMonth: false,
			isToday: isToday(date),
			isSelected: isSelectedDate(date, selectedDate.value),
			isAvailable: isAvailableDate(date, props.options.availableDates),
		});
	}

	// Add current month's days
	for (let i = 1; i <= lastDay.getDate(); i++) {
		const date = new Date(year, month, i);
		days.push({
			date,
			isCurrentMonth: true,
			isToday: isToday(date),
			isSelected: isSelectedDate(date, selectedDate.value),
			isAvailable: isAvailableDate(date, props.options.availableDates),
		});
	}

	// Add next month's days to complete the calendar
	const remainingDays = 42 - days.length; // 6 rows × 7 days
	for (let i = 1; i <= remainingDays; i++) {
		const date = new Date(year, month + 1, i);
		days.push({
			date,
			isCurrentMonth: false,
			isToday: isToday(date),
			isSelected: isSelectedDate(date, selectedDate.value),
			isAvailable: isAvailableDate(date, props.options.availableDates),
		});
	}

	return days;
});

const previousMonth = (): void => {
	currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1);
};

const nextMonth = (): void => {
	currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1);
};

const selectDate = (date: Date): void => {
	selectedDate.value = date;
	const formattedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];

	const payload: EventData = {
		action: EventAction.UPDATE,
		data: {
			id: props.id || 'date-picker',
			date: formattedDate,
		},
	};

	eventBus.emit(EventChannel.FORM, payload);
	popupService.closePopup(props.id || 'date-picker');
};
</script>

<style lang="scss">
.date-picker {
	background-color: var(--color-background);
	min-width: 280px;
	border-radius: var(--border-radius);
	padding: var(--space);

	&__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: var(--color-primary);
		color: white;
		padding: var(--space-s);
		border-radius: var(--border-radius);
	}

	&__weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		text-align: center;
		opacity: 0.25;
		font-size: 0.75em;
		font-weight: 600;
	}

	&__weekday {
		padding: var(--space-xs);
	}

	&__days {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: var(--space-xs);
	}

	&__day {
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		border-radius: var(--border-radius-sm);
		font-size: var(--font-size-s);
		transition: all var(--transition-duration) var(--transition-timing);
		opacity: 0.25;
		border-radius: var(--border-radius);
		line-height: 2.5;

		&:hover {
			background: var(--color-background-hover);
			box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-secondary), var(--color-background) 50%) inset;
		}

		&--unavailable {
			opacity: 0.1;
			pointer-events: none;
			background-color: color-mix(in srgb, var(--color-foreground), var(--color-background) 25%);
			color: var(--color-background);
		}

		&--current-month {
			color: var(--color-text);
			opacity: 1;
		}

		&--today {
			box-shadow: 0 0 2px 0 color-mix(in srgb, var(--color-secondary), var(--color-background) 25%) inset;
		}

		&--selected {
			background-color: color-mix(in srgb, var(--color-secondary), var(--color-background) 25%);
			font-weight: bold;
		}
	}
}
</style>
