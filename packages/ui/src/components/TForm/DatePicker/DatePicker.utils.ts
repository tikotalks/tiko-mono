export const isToday = (date: Date): boolean => {
	const today = new Date();
	return date.toDateString() === today.toDateString();
};

export const isSelectedDate = (date: Date, selectedDate: Date | null): boolean => {
	if (!selectedDate) return false;
	return selectedDate.toDateString() === date.toDateString();
};

export const isAvailableDate = (date: Date, availableDates: (Date | [Date, Date])[]): boolean => {
	return availableDates.some((available) => {
		// If available is a single date
		if (available instanceof Date) {
			return date.getTime() === available.getTime();
		}
		// If available is a date range [start, end]
		const [start, end] = available;
		return date >= start && date <= end;
	});
};

export const getWeekDays = ({
	locale = 'en-US',
	format = 'short',
}: {
	locale?: string;
	format?: 'short' | 'long';
}): string[] => {
	const formatter = new Intl.DateTimeFormat(locale, { weekday: format });
	const weekDays = [];
	for (let day = 0; day < 7; day++) {
		const date = new Date(Date.UTC(2021, 5, day));
		weekDays.push(formatter.format(date));
	}
	return weekDays;
};

export const findFirstAvailableDate = (dates: (Date | [Date, Date])[], after: Date): Date | null => {
	return dates.reduce((earliest: Date | null, dateOrRange) => {
		const checkDate = dateOrRange instanceof Date ? dateOrRange : dateOrRange[0];
		if (checkDate >= after && (!earliest || checkDate < earliest)) {
			return checkDate;
		}
		return earliest;
	}, null);
};
