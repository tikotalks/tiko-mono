import { describe, it, expect } from 'vitest';
import { isToday, isSelectedDate, isAvailableDate } from './DatePicker.utils';

describe('DatePicker.utils', () => {
	describe('isToday', () => {
		it('should return true if the date is today', () => {
			const today = new Date();
			expect(isToday(today)).toBe(true);
		});

		it('should return false if the date is not today', () => {
			const notToday = new Date('2000-01-01');
			expect(isToday(notToday)).toBe(false);
		});
	});

	describe('isSelectedDate', () => {
		it('should return true if the date is the selected date', () => {
			const date = new Date('2023-10-01');
			const selectedDate = new Date('2023-10-01');
			expect(isSelectedDate(date, selectedDate)).toBe(true);
		});

		it('should return false if the date is not the selected date', () => {
			const date = new Date('2023-10-01');
			const selectedDate = new Date('2023-10-02');
			expect(isSelectedDate(date, selectedDate)).toBe(false);
		});
	});

	describe('isAvailableDate', () => {
		it('should return true if the date is in the available dates array', () => {
			const date = new Date('2023-10-01');
			const availableDates = [new Date('2023-10-01'), new Date('2023-10-02')];
			expect(isAvailableDate(date, availableDates)).toBe(true);
		});

		it('should return false if the date is not in the available dates array', () => {
			const date = new Date('2023-10-03');
			const availableDates = [new Date('2023-10-01'), new Date('2023-10-02')];
			expect(isAvailableDate(date, availableDates)).toBe(false);
		});

		it('should return true if the date is within an available date range', () => {
			const date = new Date('2023-10-02');
			const availableDates = [[new Date('2023-10-01'), new Date('2023-10-03')]] as [Date, Date][];
			expect(isAvailableDate(date, availableDates)).toBe(true);
		});

		it('should return false if the date is outside an available date range', () => {
			const date = new Date('2023-10-04');
			const availableDates = [[new Date('2023-10-01'), new Date('2023-10-03')]] as [Date, Date][];
			expect(isAvailableDate(date, availableDates)).toBe(false);
		});
	});
});
