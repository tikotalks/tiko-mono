export interface DatePickerOptions {
	navigateToFirstAvailableDate: boolean;
	locale: string;
	dateFormat: string;
	availableDates: (Date | [Date, Date])[];
}

export const DefaultDatePickerOptions: DatePickerOptions = {
	navigateToFirstAvailableDate: true,
	locale: 'en-US',
	dateFormat: 'yyyy-MM-dd',
	availableDates: [],
};
